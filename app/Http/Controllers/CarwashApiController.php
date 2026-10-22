<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\CompanySetting;
use App\Models\Invoice;
use App\Models\JobCard;
use App\Models\Lead;
use App\Models\LeadFollowUp;
use App\Models\Notification;
use App\Models\Service;
use App\Models\Staff;
use App\Models\StaffAttendance;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\WhatsappChat;
use App\Support\InvoiceCalculator;
use App\Support\ServicePricing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CarwashApiController extends Controller
{
    private function currentUserId()
    {
        $user = Auth::user();
        if ($user && $user->role === 'manager' && $user->owner_id) {
            return $user->owner_id;
        }

        return Auth::id() ?: 1;
    }

    private function applyBranchFilter($query, Request $request = null)
    {
        $user = Auth::user();

        if ($user && $user->role === 'manager' && $user->assigned_branch_id) {
            if (Schema::hasColumn($query->getModel()->getTable(), 'branch_id')) {
                return $query->where(function($q) use ($user) {
                    $q->where('branch_id', $user->assigned_branch_id)->orWhereNull('branch_id');
                });
            }
            return $query;
        }

        if ($request && $request->filled('branch_id')) {
            if (Schema::hasColumn($query->getModel()->getTable(), 'branch_id')) {
                return $query->where(function($q) use ($request) {
                    $q->where('branch_id', $request->input('branch_id'))->orWhereNull('branch_id');
                });
            }
            return $query;
        }

        if ($request && $request->filled('branch_code')) {
            $code = $request->input('branch_code');
            $branch = Branch::where('user_id', $this->currentUserId())->where('code', $code)->first();
            if ($branch && Schema::hasColumn($query->getModel()->getTable(), 'branch_id')) {
                return $query->where(function($q) use ($branch) {
                    $q->where('branch_id', $branch->id)->orWhereNull('branch_id');
                });
            }
        }

        return $query;
    }

    /**
     * Get global settings, branches, notifications and chats.
     */
    public function getGlobalData(\Illuminate\Http\Request $request)
    {
        $userId = $this->currentUserId();
        $this->checkAndGenerateAppointmentReminders($userId, $request);

        return response()->json([
            'branches' => Branch::where('user_id', $userId)->where('active', true)->orderBy('name')->get(),
            'services' => $this->applyBranchFilter(Service::where('user_id', $userId)->where('active', true), $request)->orderBy('price', 'asc')->get(),
            'staff' => $this->applyBranchFilter(Staff::where('user_id', $userId), $request)->orderBy('name')->get(),
            'notifications' => $this->applyBranchFilter(Notification::where('user_id', $userId), $request)->orderBy('id', 'desc')->get(),
            'whatsapp' => $this->applyBranchFilter(WhatsappChat::where('user_id', $userId), $request)->get(),
        ]);
    }

    /**
     * Get dashboard stats and analytics from live business data.
     */
    public function getDashboardStats(Request $request)
    {
        $userId = $this->currentUserId();
        $today = now()->toDateString();

        $todayBookings = $this->applyBranchFilter(Booking::where('user_id', $userId), $request)->whereDate('created_at', $today)->count();
        $waitingBookingsCount = $this->applyBranchFilter(Booking::where('user_id', $userId), $request)->whereIn('status', ['waiting', 'confirmed'])->count();
        $activeJobCardsCount = $this->applyBranchFilter(JobCard::where('user_id', $userId), $request)
            ->whereNotIn('stage', ['completed', 'cancelled'])
            ->where(function ($query) {
                $query->whereNull('booking_id')
                    ->orWhereIn('booking_id', function ($q) {
                        $q->select('id')->from('bookings');
                    });
            })
            ->count();
        $carsWaiting = $waitingBookingsCount + $activeJobCardsCount;
        $completedToday = $this->applyBranchFilter(JobCard::where('user_id', $userId), $request)
            ->where('stage', 'completed')
            ->whereDate('updated_at', $today)
            ->where(function ($query) {
                $query->whereNull('booking_id')
                    ->orWhereIn('booking_id', function ($q) {
                        $q->select('id')->from('bookings');
                    });
            })
            ->count();
        $pickupBookings = $this->applyBranchFilter(Booking::where('user_id', $userId), $request)->where('pickup_required', true)->whereDate('created_at', $today)->count();
        $lowStockAlerts = $this->applyBranchFilter(InventoryItem::where('user_id', $userId), $request)->where('low_stock_alert', true)
            ->whereColumn('stock', '<=', 'reorder')
            ->count();

        $revenueToday = $this->applyBranchFilter(Invoice::where('user_id', $userId), $request)->where('status', 'paid')->whereDate('created_at', $today)->sum('amount');
        $revenueWeekly = $this->applyBranchFilter(Invoice::where('user_id', $userId), $request)->where('status', 'paid')->where('created_at', '>=', now()->subDays(7))->sum('amount');
        $revenueMonthly = $this->applyBranchFilter(Invoice::where('user_id', $userId), $request)->where('status', 'paid')->where('created_at', '>=', now()->startOfMonth())->sum('amount');
        $revenueTotal = $this->applyBranchFilter(Invoice::where('user_id', $userId), $request)->where('status', 'paid')->sum('amount');
        $pendingPayments = $this->applyBranchFilter(Invoice::where('user_id', $userId), $request)->where('status', 'pending')->sum('amount');
        $pendingCount = $this->applyBranchFilter(Invoice::where('user_id', $userId), $request)->where('status', 'pending')->count();
        $overdueCount = $this->applyBranchFilter(Invoice::where('user_id', $userId), $request)->where('status', 'pending')
            ->whereNotNull('due_at')
            ->where('due_at', '<', now())
            ->count();

        // Revenue chart range from the dashboard's "Last N Days" dropdown
        $days = (int) $request->query('days', 7);
        if (!in_array($days, [7, 14, 30], true)) {
            $days = 7;
        }

        $revenueData = [];
        $revenueCategories = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $revenueCategories[] = $days === 7 ? $date->format('D') : $date->format('d M');
            $revenueData[] = (float) $this->applyBranchFilter(Invoice::where('user_id', $userId), $request)->where('status', 'paid')
                ->whereDate('created_at', $date->toDateString())
                ->sum('amount');
        }

        // Yesterday's figures, for the "vs yesterday" change on the KPI cards
        $yesterday = now()->subDay()->toDateString();
        $yesterdayBookings = $this->applyBranchFilter(Booking::where('user_id', $userId), $request)->whereDate('created_at', $yesterday)->count();
        $yesterdayCompleted = $this->applyBranchFilter(JobCard::where('user_id', $userId), $request)
            ->where('stage', 'completed')->whereDate('updated_at', $yesterday)->count();
        $yesterdayRevenue = $this->applyBranchFilter(Invoice::where('user_id', $userId), $request)->where('status', 'paid')->whereDate('created_at', $yesterday)->sum('amount');

        // Bottom panels: latest payments, top services this month
        $recentPayments = $this->applyBranchFilter(Invoice::where('user_id', $userId), $request)
            ->orderByDesc('created_at')->limit(5)
            ->get(['id', 'invoice_number', 'customer', 'amount', 'status', 'date', 'created_at']);
        $topServicesMonth = $this->applyBranchFilter(Invoice::where('user_id', $userId), $request)
            ->where('created_at', '>=', now()->startOfMonth())
            ->selectRaw('service, COUNT(*) as count, SUM(amount) as revenue')
            ->groupBy('service')->orderByDesc('count')->orderByDesc('revenue')->limit(5)
            ->get()
            ->map(fn ($s) => ['name' => $s->service, 'count' => (int) $s->count, 'revenue' => (float) $s->revenue]);

        return response()->json([
            'todayBookings' => $todayBookings,
            'yesterdayBookings' => $yesterdayBookings,
            'yesterdayCompleted' => $yesterdayCompleted,
            'yesterdayRevenue' => $yesterdayRevenue,
            'recentPayments' => $recentPayments,
            'topServicesMonth' => $topServicesMonth,
            'carsWaiting' => $carsWaiting,
            'completedToday' => $completedToday,
            'pickupBookings' => $pickupBookings,
            'lowStockAlerts' => $lowStockAlerts,
            'revenueToday' => $revenueToday,
            'revenueWeekly' => $revenueWeekly,
            'revenueMonthly' => $revenueMonthly,
            'revenueTotal' => $revenueTotal,
            'pendingPayments' => $pendingPayments,
            'pendingCount' => $pendingCount,
            'overdueCount' => $overdueCount,
            'revenueChart' => [
                'data' => $revenueData,
                'categories' => $revenueCategories,
            ],
        ]);
    }

    public function getReportsData(\Illuminate\Http\Request $request)
    {
        $userId = $this->currentUserId();
        $now = now();
        $timeframe = $request->query('timeframe', 'monthly');

        if ($timeframe === 'daily') {
            $startOfPeriod = $now->copy()->startOfDay();
            $startOfLastPeriod = $now->copy()->subDay()->startOfDay();
            $endOfLastPeriod = $now->copy()->subDay()->endOfDay();
        } elseif ($timeframe === 'weekly') {
            $startOfPeriod = $now->copy()->startOfWeek();
            $startOfLastPeriod = $now->copy()->subWeek()->startOfWeek();
            $endOfLastPeriod = $now->copy()->subWeek()->endOfWeek();
        } else {
            $startOfPeriod = $now->copy()->startOfMonth();
            $startOfLastPeriod = $now->copy()->subMonth()->startOfMonth();
            $endOfLastPeriod = $now->copy()->subMonth()->endOfMonth();
        }

        $revenue = $this->applyBranchFilter(Invoice::where('user_id', $userId)->where('status', 'paid'), $request)
            ->where('created_at', '>=', $startOfPeriod)
            ->sum('amount');

        $revenueLastMonth = $this->applyBranchFilter(Invoice::where('user_id', $userId)->where('status', 'paid'), $request)
            ->whereBetween('created_at', [$startOfLastPeriod, $endOfLastPeriod])
            ->sum('amount');

        $taxCollected = Schema::hasColumn('invoices', 'tax_amount')
            ? $this->applyBranchFilter(Invoice::where('user_id', $userId)->where('status', 'paid'), $request)
                ->where('created_at', '>=', $startOfPeriod)
                ->sum('tax_amount')
            : 0;

        $staffQuery = $this->applyBranchFilter(Staff::where('user_id', $userId), $request);
        if (Schema::hasColumn('staff', 'is_active')) {
            $staffQuery->where('is_active', true);
        }
        $expenses = $this->applyBranchFilter(Expense::where('user_id', $userId), $request)
            ->where('expense_date', '>=', $startOfPeriod->toDateString())
            ->sum('amount');

        $expensesLastMonth = $this->applyBranchFilter(Expense::where('user_id', $userId), $request)
            ->whereBetween('expense_date', [$startOfLastPeriod->toDateString(), $endOfLastPeriod->toDateString()])
            ->sum('amount');

        $profit = $revenue - $expenses;
        $profitLastMonth = $revenueLastMonth - $expensesLastMonth;

        $revenueDelta = $revenueLastMonth > 0
            ? round((($revenue - $revenueLastMonth) / $revenueLastMonth) * 100, 1)
            : ($revenue > 0 ? 100 : 0);
        $expensesDelta = $expensesLastMonth > 0
            ? round((($expenses - $expensesLastMonth) / $expensesLastMonth) * 100, 1)
            : ($expenses > 0 ? 100 : 0);
        $profitDelta = $profitLastMonth > 0
            ? round((($profit - $profitLastMonth) / $profitLastMonth) * 100, 1)
            : ($profit > 0 ? 100 : 0);

        $totalCustomers = $this->applyBranchFilter(Customer::where('user_id', $userId), $request)->count();
        $repeatCount = 0;
        if ($totalCustomers > 0) {
            $customerPhones = $this->applyBranchFilter(Customer::where('user_id', $userId), $request)->pluck('phone')->toArray();
            $repeatCount = $this->applyBranchFilter(Invoice::where('user_id', $userId), $request)->selectRaw('phone')
                ->whereIn('phone', $customerPhones)
                ->groupBy('phone')
                ->havingRaw('COUNT(*) > 1')
                ->get()
                ->count();
        }
        $repeatPercentage = $totalCustomers > 0 ? min(100, round(($repeatCount / $totalCustomers) * 100)) : 0;

        $completedCards = JobCard::where('user_id', $userId)->where('stage', 'completed')
            ->where('updated_at', '>=', $startOfPeriod)
            ->get();
        $hourlyCounts = [];
        foreach ($completedCards as $card) {
            if ($card->updated_at) {
                $hourLabel = $card->updated_at->format('g A');
                $hourlyCounts[$hourLabel] = ($hourlyCounts[$hourLabel] ?? 0) + 1;
            }
        }

        $standardHours = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM'];
        $peakHours = [];
        foreach ($standardHours as $hourLabel) {
            $peakHours[] = [
                'hour' => $hourLabel,
                'cars' => $hourlyCounts[$hourLabel] ?? 0,
            ];
        }

        $staffPerformance = $this->applyBranchFilter(Staff::where('user_id', $userId), $request)->get()
            ->map(function (Staff $staff) use ($userId, $request, $startOfPeriod) {
                return [
                    'name' => $staff->name,
                    'jobs' => $this->applyBranchFilter(JobCard::where('user_id', $userId), $request)
                        ->where('staff', $staff->name)
                        ->where('stage', 'completed')
                        ->where('updated_at', '>=', $startOfPeriod)
                        ->count(),
                ];
            })
            ->sortByDesc('jobs')
            ->values()
            ->toArray();

        $topServices = JobCard::where('user_id', $userId)->selectRaw('service, COUNT(*) as count')
            ->where('stage', 'completed')
            ->where('updated_at', '>=', $startOfPeriod)
            ->groupBy('service')
            ->orderByDesc('count')
            ->limit(6)
            ->get()
            ->map(fn ($service) => [
                'name' => $service->service,
                'count' => (int) $service->count,
            ])
            ->toArray();

        $revenueChart = [];
        
        if ($timeframe === 'daily') {
            $standardHours = ['8 AM' => 8, '9 AM' => 9, '10 AM' => 10, '11 AM' => 11, '12 PM' => 12, '1 PM' => 13, '2 PM' => 14, '3 PM' => 15, '4 PM' => 16, '5 PM' => 17, '6 PM' => 18, '7 PM' => 19, '8 PM' => 20];
            foreach ($standardHours as $label => $h) {
                $amount = (float) $this->applyBranchFilter(Invoice::where('user_id', $userId)->where('status', 'paid'), $request)
                    ->whereDate('created_at', $now->toDateString())
                    ->whereTime('created_at', '>=', str_pad((string)$h, 2, '0', STR_PAD_LEFT).':00:00')
                    ->whereTime('created_at', '<=', str_pad((string)$h, 2, '0', STR_PAD_LEFT).':59:59')
                    ->sum('amount');
                $revenueChart[] = ['date' => $label, 'amount' => $amount];
            }
        } elseif ($timeframe === 'weekly') {
            $daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            foreach ($daysOfWeek as $i => $dayName) {
                $date = $now->copy()->startOfWeek()->addDays($i);
                if ($date->isAfter($now)) break;
                $amount = (float) $this->applyBranchFilter(Invoice::where('user_id', $userId)->where('status', 'paid'), $request)
                    ->whereDate('created_at', $date->toDateString())
                    ->sum('amount');
                $revenueChart[] = ['date' => $dayName, 'amount' => $amount];
            }
        } else {
            $daysInMonth = (int) $now->format('d');
            for ($day = 1; $day <= $daysInMonth; $day++) {
                $date = $now->copy()->startOfMonth()->addDays($day - 1);
                $amount = (float) $this->applyBranchFilter(Invoice::where('user_id', $userId)->where('status', 'paid'), $request)
                    ->whereDate('created_at', $date->toDateString())
                    ->sum('amount');
                $revenueChart[] = ['date' => $date->format('d M'), 'amount' => $amount];
            }
        }

        $branchBreakdown = collect();
        if (Schema::hasColumn('bookings', 'branch_id')) {
            $branchBreakdownQuery = Branch::where('user_id', $userId)
                ->withCount([
                    'bookings' => fn ($query) => $query->where('user_id', $userId)->where('created_at', '>=', $startOfPeriod),
                ])
                ->orderBy('name');
            if (Schema::hasColumn('branches', 'active')) {
                $branchBreakdownQuery->where('active', true);
            }
            $branchBreakdown = $branchBreakdownQuery->get(['id', 'name', 'location']);
        } else {
            $branchBreakdown = Branch::where('user_id', $userId)
                ->when(Schema::hasColumn('branches', 'active'), function ($query) {
                    $query->where('active', true);
                })
                ->orderBy('name')
                ->get(['id', 'name', 'location'])
                ->map(function ($branch) {
                    $branch->setAttribute('bookings_count', 0);

                    return $branch;
                });
        }

        $lowStockItemsQuery = $this->applyBranchFilter(InventoryItem::where('user_id', $userId), $request);
        if (Schema::hasColumn('inventory_items', 'low_stock_alert')) {
            $lowStockItemsQuery->where('low_stock_alert', true);
        }
        $lowStockItems = $lowStockItemsQuery
            ->whereColumn('stock', '<=', 'reorder')
            ->orderBy('name')
            ->get();

        return response()->json([
            'kpis' => [
                'revenue' => $revenue,
                'expenses' => $expenses,
                'profit' => $profit,
                'taxCollected' => $taxCollected,
                'repeatPercentage' => $repeatPercentage,
                'revenueDelta' => $revenueDelta,
                'expensesDelta' => $expensesDelta,
                'profitDelta' => $profitDelta,
            ],
            'peakHours' => $peakHours,
            'staffPerformance' => $staffPerformance,
            'topServices' => $topServices,
            'dailyRevenue' => $revenueChart,
            'branchBreakdown' => $branchBreakdown,
            'lowStockItems' => $lowStockItems,
                        'monthLabel' => $timeframe === 'daily' 
                ? 'Today (' . $now->format('d M') . ')' 
                : ($timeframe === 'weekly' ? 'This Week' : $now->format('F Y')),
        ]);
    }

    /**
     * Bookings Endpoints.
     */
    public function getBookings(Request $request)
    {
        $userId = $this->currentUserId();
        $query = Booking::where('user_id', $userId)->with('branch');
        $query = $this->applyBranchFilter($query, $request);
        // Order waiting washes by newly added first
        $bookings = $query->orderByDesc('created_at')->get();

        foreach ($bookings as $b) {
            $jobCard = JobCard::where('user_id', $userId)
                ->where(function ($q) use ($b) {
                    $q->where('booking_id', $b->id);
                    if ($b->phone && $b->vehicle_plate) {
                        // Fallback only if no booking_id, but MUST match both phone and vehicle plate!
                        $q->orWhere(function($sub) use ($b) {
                            $sub->whereNull('booking_id')
                                ->where('phone', $b->phone)
                                ->where('vehicle', 'LIKE', $b->vehicle_plate.'%');
                        });
                    }
                })
                ->orderByDesc('id')
                ->first();

            if ($jobCard) {
                $targetStatus = match ($jobCard->stage) {
                    'completed' => 'completed',
                    'inprogress', 'assigned' => 'inprogress',
                    'cancelled' => 'cancelled',
                    default => null,
                };

                if ($targetStatus && $b->status !== $targetStatus) {
                    $b->status = $targetStatus;
                    $b->save();
                }
            }
        }

        return response()->json($bookings);
    }

    public function createBooking(Request $request)
    {
        @mkdir(public_path('uploads/bookings'), 0755, true);
        file_put_contents(public_path('uploads/bookings/last_request.txt'), json_encode($request->all()) . "
FILES:
" . json_encode(array_keys($request->allFiles())));
        $validated = $request->validate([
            'customer' => 'required|string|max:255',
            'phone' => 'nullable|string|max:255',
            'vehicle' => 'nullable|string|max:255',
            'vehicle_plate' => 'nullable|string|max:255',
            'vehicle_type' => 'nullable|string|max:255',
            'service' => 'required|string|max:255',
            'source' => 'required|string|max:255',
            'status' => 'required|string|max:255',
            'time' => 'required|string',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'booking_date' => 'nullable|date',
            'pickup_required' => 'nullable|boolean',
            'whatsapp_opt_in' => 'nullable|boolean',
            'notes' => 'nullable|string',
            'reminder_type' => 'nullable|string|in:none,1_week,1_month,custom',
            'reminder_date' => 'nullable|date',
            'reminder_note' => 'nullable|string',
        ]);

        $userId = $this->currentUserId();
        
        if (!empty($validated['vehicle_plate'])) {
            $existing = \App\Models\Booking::where('user_id', $userId)
                ->whereIn('status', ['waiting', 'confirmed', 'inprogress'])
                ->where('vehicle_plate', $validated['vehicle_plate'])
                ->exists();
            if ($existing) {
                return response()->json(['message' => 'Vehicle already in queue'], 422);
            }
            
            $existingJc = \App\Models\JobCard::where('user_id', $userId)
                ->whereIn('stage', ['assigned', 'inprogress'])
                ->where('vehicle', 'LIKE', $validated['vehicle_plate'].'%')
                ->exists();
            if ($existingJc) {
                return response()->json(['message' => 'Vehicle already in queue'], 422);
            }
        }

        return DB::transaction(function () use ($validated, $userId) {
            [$minutes, $timeLabel] = $this->formatTimeLabel($validated['time']);
            $branchId = $validated['branch_id'] ?? $this->defaultBranchId();

            $booking = Booking::create([
                'user_id' => $userId,
                'branch_id' => $branchId,
                'booking_date' => $validated['booking_date'] ?? now()->toDateString(),
                'customer' => $validated['customer'],
                'phone' => $validated['phone'] ?? null,
                'vehicle' => $validated['vehicle'] ?? null,
                'vehicle_plate' => $validated['vehicle_plate'] ?? null,
                'vehicle_type' => $validated['vehicle_type'] ?? null,
                'service' => $validated['service'],
                'source' => $validated['source'],
                'pickup_required' => (bool) ($validated['pickup_required'] ?? false),
                'whatsapp_opt_in' => (bool) ($validated['whatsapp_opt_in'] ?? true),
                'notes' => $validated['notes'] ?? null,
                'reminder_type' => $validated['reminder_type'] ?? null,
                'reminder_date' => $validated['reminder_date'] ?? null,
                'reminder_note' => $validated['reminder_note'] ?? null,
                'reminder_notified' => false,
                'status' => $validated['status'],
                'minutes' => $minutes,
                'time_label' => $timeLabel,
            ]);

            $customer = $this->findOrCreateCustomerFromBooking($validated, $userId);

            if ($customer) {
                $customer->forceFill([
                    'last_visit' => 'Today',
                    'last_visit_at' => now(),
                    'follow_up_due_at' => now()->addDays(14),
                ])->save();
            }

            $this->syncVehicleFromBooking($validated, $customer?->id, $userId);
            $this->createFollowUpNotification($booking, $customer, $userId);

            // Better file check for both single and array
            $uploadedPhotos = request()->file('photos_before') ?? request()->file('photos_before[]');
            if ($uploadedPhotos) {
                $uploadDir = public_path('uploads/bookings');
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                $files = is_array($uploadedPhotos) ? $uploadedPhotos : [$uploadedPhotos];
                foreach ($files as $index => $file) {
                    $idx = $index + 1;
                    $file->move($uploadDir, "bk_{$booking->id}_before_{$idx}.jpg");
                }
            }

            return response()->json($booking->load('branch'), 201);
        });
    }

    public function updateBooking(Request $request, $id)
    {
        $validated = $request->validate([
            'customer' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'vehicle' => 'nullable|string|max:255',
            'vehicle_plate' => 'nullable|string|max:255',
            'vehicle_type' => 'nullable|string|max:255',
            'service' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'time' => 'nullable|string',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'booking_date' => 'nullable|date',
            'pickup_required' => 'nullable|boolean',
            'whatsapp_opt_in' => 'nullable|boolean',
            'notes' => 'nullable|string',
            'reminder_type' => 'nullable|string|in:none,1_week,1_month,custom',
            'reminder_date' => 'nullable|date',
            'reminder_note' => 'nullable|string',
        ]);

        $userId = $this->currentUserId();
        $booking = $this->applyBranchFilter(Booking::where('user_id', $userId), request())->findOrFail($id);

        if (isset($validated['time'])) {
            [$minutes, $timeLabel] = $this->formatTimeLabel($validated['time']);
            $booking->minutes = $minutes;
            $booking->time_label = $timeLabel;
        }

        $booking->update(collect($validated)->except('time')->toArray());

        return response()->json($booking->load('branch'));
    }

    public function deleteBooking($id)
    {
        $userId = $this->currentUserId();
        $booking = $this->applyBranchFilter(Booking::where('user_id', $userId), request())->findOrFail($id);

        // Also delete any active (non-completed) JobCard associated with this booking
        JobCard::where('user_id', $userId)
            ->where('booking_id', $id)
            ->where('stage', '!=', 'completed')
            ->delete();

        $booking->delete();

        return response()->json(['status' => 'success']);
    }

    /**
     * Customers (CRM) Endpoints.
     */
    public function getCustomers(Request $request)
    {
        $userId = $this->currentUserId();
        $query = Customer::where('user_id', $userId)->with('vehicles');
        $query = $this->applyBranchFilter($query, $request);
        return response()->json($query->orderBy('starred', 'desc')->orderBy('name', 'asc')->get());
    }

    public function createCustomer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'plan' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'district' => 'nullable|string|max:255',
            'gstin' => 'nullable|string|max:255',
            'loyalty_points' => 'nullable|integer|min:0',
            'follow_up_due_at' => 'nullable|date',
            'vehicles' => 'nullable|array',
            'vehicles.*.brand' => 'required|string',
            'vehicles.*.plate' => 'required|string',
        ]);

        $userId = $this->currentUserId();
        $plan = $validated['plan'] ?? 'none';
        $membership = $this->buildMembershipLabel($plan);

        $customer = Customer::create([
        'branch_id' => $this->defaultBranchId(),
            'user_id' => $userId,
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'plan' => $plan,
            'points' => $plan !== 'none' ? 500 : 0,
            'loyalty_points' => $validated['loyalty_points'] ?? 0,
            'district' => $validated['district'] ?? null,
            'gstin' => $validated['gstin'] ?? null,
            'last_visit' => 'Today',
            'last_visit_at' => now(),
            'follow_up_due_at' => $validated['follow_up_due_at'] ?? now()->addDays(14),
            'starred' => false,
            'notes' => $validated['notes'] ?? '',
            'membership' => $membership,
        ]);

        if (! empty($validated['vehicles'])) {
            foreach ($validated['vehicles'] as $vehicle) {
                Vehicle::create([
        'branch_id' => $this->defaultBranchId(),
                    'user_id' => $userId,
                    'plate' => $vehicle['plate'],
                    'customer_id' => $customer->id,
                    'registration_state' => $this->registrationStateFromPlate($vehicle['plate']),
                    'brand' => $vehicle['brand'],
                    'colour' => 'Unknown',
                    'type' => 'sedan',
                    'fuel' => 'Petrol',
                    'last_wash' => 'Today',
                    'next' => date('d M', strtotime('+14 days')),
                    'next_service_at' => now()->addDays(14),
                ]);
            }
        }

        return response()->json($customer->load('vehicles'), 201);
    }

    public function updateCustomer(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
        ]);

        $userId = $this->currentUserId();
        $customer = $this->applyBranchFilter(Customer::where('user_id', $userId), request())->findOrFail($id);
        $customer->update($validated);

        return response()->json($customer);
    }

    public function deleteCustomer($id)
    {
        $userId = $this->currentUserId();
        $customer = $this->applyBranchFilter(Customer::where('user_id', $userId), request())->findOrFail($id);
        
        // Delete all associated vehicles before deleting the customer
        \App\Models\Vehicle::where('customer_id', $customer->id)->delete();
        
        $customer->delete();

        return response()->json(['status' => 'success']);
    }

    /**
     * Leads Endpoints.
     */
    public function getLeads(Request $request)
    {
        $userId = $this->currentUserId();
        $query = Lead::where('user_id', $userId)->with(['customer', 'followUps']);
        $query = $this->applyBranchFilter($query, $request);

        if ($request->filled('category') && $request->input('category') !== 'all') {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('source') && $request->input('source') !== 'all') {
            $query->where('source', $request->input('source'));
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('phone', 'like', $search)
                  ->orWhere('vehicle', 'like', $search)
                  ->orWhere('vehicle_plate', 'like', $search)
                  ->orWhere('service_interested', 'like', $search)
                  ->orWhere('insurance_type', 'like', $search)
                  ->orWhere('policy_number', 'like', $search)
                  ->orWhere('destination', 'like', $search);
            });
        }

        $leads = $query->orderBy('created_at', 'desc')->get();

        // Calculate KPI stats (scoped to current category filter if specified)
        $allLeadsQuery = Lead::where('user_id', $userId);
        $allLeadsQuery = $this->applyBranchFilter($allLeadsQuery, $request);
        if ($request->filled('category') && $request->input('category') !== 'all') {
            $allLeadsQuery->where('category', $request->input('category'));
        }
        $allLeads = $allLeadsQuery->get();

        $today = now()->format('Y-m-d');

        // Leads that have a follow-up scheduled (and are active: not converted or lost)
        $scheduledFollowUps = $allLeads->filter(function ($lead) {
            return !empty($lead->follow_up_date) && !in_array($lead->status, ['converted', 'lost']);
        });

        // Leads with follow-up due today or overdue
        $dueOrOverdueCount = $scheduledFollowUps->filter(function ($lead) use ($today) {
            $fDate = is_string($lead->follow_up_date) ? substr($lead->follow_up_date, 0, 10) : $lead->follow_up_date->format('Y-m-d');
            return $fDate <= $today;
        })->count();

        // Total interactions logged across user's leads
        $leadIds = $allLeads->pluck('id');
        $totalInteractionsCount = LeadFollowUp::whereIn('lead_id', $leadIds)->count();

        // Category totals across all user leads
        $baseCatQuery = Lead::where('user_id', $userId);
        $baseCatQuery = $this->applyBranchFilter($baseCatQuery, $request);
        $categoryCounts = [
            'detailing' => (clone $baseCatQuery)->where('category', 'detailing')->count(),
            'insurance' => (clone $baseCatQuery)->where('category', 'insurance')->count(),
            'travel' => (clone $baseCatQuery)->where('category', 'travel')->count(),
        ];

        $stats = [
            'total' => $allLeads->count(),
            'new' => $allLeads->where('status', 'new')->count(),
            'in_discussion' => $allLeads->whereIn('status', ['contacted', 'in_discussion', 'quote_sent'])->count(),
            'follow_up_scheduled' => $scheduledFollowUps->count(),
            'follow_up_due' => $dueOrOverdueCount,
            'total_followups_logged' => $totalInteractionsCount,
            'converted' => $allLeads->where('status', 'converted')->count(),
            'conversion_rate' => $allLeads->count() > 0 ? round(($allLeads->where('status', 'converted')->count() / $allLeads->count()) * 100, 1) : 0,
            'pipeline_value' => (float) $allLeads->whereNotIn('status', ['lost', 'converted'])->sum('estimated_value'),
            'converted_value' => (float) $allLeads->where('status', 'converted')->sum('estimated_value'),
            'category_counts' => $categoryCounts,
        ];

        // Insurance alerts calculation (policies taken where validity date has expired or expiring within 30 days)
        $thirtyDaysAhead = now()->addDays(30)->format('Y-m-d');
        $insuranceQuery = Lead::where('user_id', $userId)
            ->where('category', 'insurance')
            ->whereNotNull('validity_to_date');
        $insuranceQuery = $this->applyBranchFilter($insuranceQuery, $request);
        $insurancePolicies = $insuranceQuery->orderBy('validity_to_date', 'asc')->get();

        $expiredPolicies = $insurancePolicies->filter(function ($lead) use ($today) {
            $toDate = is_string($lead->validity_to_date) ? substr($lead->validity_to_date, 0, 10) : $lead->validity_to_date->format('Y-m-d');
            return $toDate <= $today;
        })->values();

        $expiringSoonPolicies = $insurancePolicies->filter(function ($lead) use ($today, $thirtyDaysAhead) {
            $toDate = is_string($lead->validity_to_date) ? substr($lead->validity_to_date, 0, 10) : $lead->validity_to_date->format('Y-m-d');
            return $toDate > $today && $toDate <= $thirtyDaysAhead;
        })->values();

        $insuranceAlerts = [
            'expired_count' => $expiredPolicies->count(),
            'expired_leads' => $expiredPolicies,
            'expiring_soon_count' => $expiringSoonPolicies->count(),
            'expiring_soon_leads' => $expiringSoonPolicies,
        ];

        return response()->json([
            'leads' => $leads,
            'stats' => $stats,
            'insurance_alerts' => $insuranceAlerts,
        ]);
    }

    public function createLead(Request $request)
    {
        $validated = $request->validate([
            'category' => 'nullable|string|in:detailing,insurance,travel',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'email' => 'nullable|string|max:255',
            'vehicle' => 'nullable|string|max:255',
            'vehicle_plate' => 'nullable|string|max:255',
            'service_interested' => 'nullable|string|max:255',
            'insurance_type' => 'nullable|string|max:255',
            'policy_number' => 'nullable|string|max:255',
            'validity_from_date' => 'nullable|date',
            'validity_to_date' => 'nullable|date',
            'insurance_taken' => 'nullable|boolean',
            'destination' => 'nullable|string|max:255',
            'travel_date' => 'nullable|date',
            'return_date' => 'nullable|date',
            'passengers_count' => 'nullable|integer|min:1',
            'source' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'estimated_value' => 'nullable|numeric|min:0',
            'follow_up_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'branch_id' => 'nullable|integer',
        ]);

        $userId = $this->currentUserId();

        $lead = Lead::create([
            'user_id' => $userId,
            'branch_id' => $validated['branch_id'] ?? $this->defaultBranchId(),
            'category' => $validated['category'] ?? 'detailing',
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'vehicle' => $validated['vehicle'] ?? null,
            'vehicle_plate' => $validated['vehicle_plate'] ?? null,
            'service_interested' => $validated['service_interested'] ?? null,
            'insurance_type' => $validated['insurance_type'] ?? null,
            'policy_number' => $validated['policy_number'] ?? null,
            'validity_from_date' => $validated['validity_from_date'] ?? null,
            'validity_to_date' => $validated['validity_to_date'] ?? null,
            'insurance_taken' => $validated['insurance_taken'] ?? false,
            'destination' => $validated['destination'] ?? null,
            'travel_date' => $validated['travel_date'] ?? null,
            'return_date' => $validated['return_date'] ?? null,
            'passengers_count' => $validated['passengers_count'] ?? null,
            'source' => $validated['source'] ?? 'Walk-in',
            'status' => $validated['status'] ?? 'new',
            'estimated_value' => $validated['estimated_value'] ?? 0,
            'follow_up_date' => $validated['follow_up_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json($lead, 201);
    }

    public function updateLead(Request $request, $id)
    {
        $userId = $this->currentUserId();
        $lead = Lead::where('user_id', $userId)->findOrFail($id);

        $validated = $request->validate([
            'category' => 'nullable|string|in:detailing,insurance,travel',
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:255',
            'email' => 'nullable|string|max:255',
            'vehicle' => 'nullable|string|max:255',
            'vehicle_plate' => 'nullable|string|max:255',
            'service_interested' => 'nullable|string|max:255',
            'insurance_type' => 'nullable|string|max:255',
            'policy_number' => 'nullable|string|max:255',
            'validity_from_date' => 'nullable|date',
            'validity_to_date' => 'nullable|date',
            'insurance_taken' => 'nullable|boolean',
            'destination' => 'nullable|string|max:255',
            'travel_date' => 'nullable|date',
            'return_date' => 'nullable|date',
            'passengers_count' => 'nullable|integer|min:1',
            'source' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'estimated_value' => 'nullable|numeric|min:0',
            'follow_up_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'branch_id' => 'nullable|integer',
        ]);

        $lead->update($validated);

        return response()->json($lead);
    }

    public function deleteLead(Request $request, $id)
    {
        $userId = $this->currentUserId();
        $lead = Lead::where('user_id', $userId)->findOrFail($id);
        $lead->delete();

        return response()->json(['status' => 'success', 'message' => 'Lead deleted successfully']);
    }

    public function convertLead(Request $request, $id)
    {
        $userId = $this->currentUserId();
        $lead = Lead::where('user_id', $userId)->findOrFail($id);

        // Check if customer already exists for this phone or create new
        $customer = Customer::where('user_id', $userId)->where('phone', $lead->phone)->first();

        if (!$customer) {
            $customer = Customer::create([
                'user_id' => $userId,
                'branch_id' => $lead->branch_id ?: $this->defaultBranchId(),
                'name' => $lead->name,
                'phone' => $lead->phone,
                'notes' => $lead->notes ? "Converted from Lead. Notes: {$lead->notes}" : 'Converted from Lead.',
                'last_visit' => 'Today',
                'last_visit_at' => now(),
                'follow_up_due_at' => $lead->follow_up_date ?: now()->addDays(14),
                'starred' => false,
                'plan' => 'none',
                'membership' => 'STANDARD',
            ]);
        }

        // If vehicle info was captured in the lead, create vehicle if not exists
        if ($lead->vehicle_plate || $lead->vehicle) {
            $plate = $lead->vehicle_plate ?: 'TBD-' . strtoupper(Str::random(4));
            $existingVehicle = Vehicle::where('user_id', $userId)->where('plate', $plate)->first();
            if (!$existingVehicle) {
                Vehicle::create([
                    'user_id' => $userId,
                    'branch_id' => $lead->branch_id ?: $this->defaultBranchId(),
                    'customer_id' => $customer->id,
                    'plate' => $plate,
                    'brand' => $lead->vehicle ?: 'Unknown',
                    'type' => 'sedan',
                    'fuel' => 'Petrol',
                    'colour' => 'Unknown',
                    'registration_state' => $this->registrationStateFromPlate($plate),
                    'last_wash' => 'Today',
                    'next' => date('d M', strtotime('+14 days')),
                    'next_service_at' => now()->addDays(14),
                ]);
            }
        }

        // Update lead
        $lead->update([
            'status' => 'converted',
            'converted_customer_id' => $customer->id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Lead converted successfully',
            'lead' => $lead->fresh('customer'),
            'customer' => $customer->load('vehicles'),
        ]);
    }

    public function getLeadFollowUps(Request $request, $id)
    {
        $userId = $this->currentUserId();
        $lead = Lead::where('user_id', $userId)->findOrFail($id);
        return response()->json($lead->followUps);
    }

    public function addLeadFollowUp(Request $request, $id)
    {
        $userId = $this->currentUserId();
        $lead = Lead::where('user_id', $userId)->findOrFail($id);

        $validated = $request->validate([
            'notes' => 'required|string',
            'interaction_type' => 'nullable|string|max:100',
            'next_follow_up_date' => 'nullable|date',
            'status' => 'nullable|string|max:50',
        ]);

        $followUp = LeadFollowUp::create([
            'lead_id' => $lead->id,
            'user_id' => $userId,
            'interaction_type' => $validated['interaction_type'] ?? 'Phone Call',
            'notes' => $validated['notes'],
            'next_follow_up_date' => $validated['next_follow_up_date'] ?? null,
            'status' => $validated['status'] ?? $lead->status,
        ]);

        // Update lead's follow_up_date and status
        $updates = [];
        if (!empty($validated['next_follow_up_date'])) {
            $updates['follow_up_date'] = $validated['next_follow_up_date'];
        }
        if (!empty($validated['status'])) {
            $updates['status'] = $validated['status'];
        }
        if (!empty($updates)) {
            $lead->update($updates);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Follow-up logged successfully',
            'follow_up' => $followUp,
            'lead' => $lead->fresh(['customer', 'followUps']),
        ], 201);
    }

    /**
     * Vehicles Endpoints.
     */
    public function getVehicles(Request $request)
    {
        $userId = $this->currentUserId();
        $query = Vehicle::where('user_id', $userId)->with('customer');
        $query = $this->applyBranchFilter($query, $request);
        $vehicles = $query->orderBy('updated_at', 'desc')->get();

        $jobCards = \App\Models\JobCard::where('user_id', $userId)
                ->where('stage', 'completed')
                ->get(['vehicle', 'service']);

        foreach ($vehicles as $v) {
            $count = 0;
            $services = [];
            if ($v->plate) {
                foreach ($jobCards as $jc) {
                    if (stripos($jc->vehicle, $v->plate) !== false) {
                        $count++;
                        foreach (explode(',', (string) $jc->service) as $service) {
                            $service = trim($service);
                            if ($service !== '') {
                                $services[strtolower($service)] = $service;
                            }
                        }
                    }
                }
            }
            $v->loyalty_count = $count;
            $v->services = array_values($services);
        }

        return response()->json($vehicles);
    }

    public function deleteVehicle($id)
    {
        $userId = $this->currentUserId();
        $vehicle = $this->applyBranchFilter(Vehicle::where('user_id', $userId), request())->findOrFail($id);
        $vehicle->delete();

        return response()->json(['status' => 'success']);
    }

    public function updateVehicle(Request $request, $id)
    {
        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'colour' => 'nullable|string|max:255',
            'type' => 'required|string|max:255',
            'fuel' => 'nullable|string|max:255',
            'last_wash' => 'nullable|string|max:255',
        ]);

        $userId = $this->currentUserId();
        $vehicle = $this->applyBranchFilter(Vehicle::where('user_id', $userId), request())->findOrFail($id);
        $vehicle->update($validated);

        return response()->json($vehicle->load('customer'));
    }

    public function getLoyalty(Request $request)
    {
        $vehicle = $request->query('vehicle');
        $phone = $request->query('phone');
        $userId = $this->currentUserId();
        
        if (!$vehicle && !$phone) {
            return response()->json(['count' => 0]);
        }

        $query = JobCard::where('user_id', $userId)->where('stage', 'completed');
        
        if ($vehicle) {
            $query->where('vehicle', 'LIKE', '%' . $vehicle . '%');
        } elseif ($phone) {
            $query->where('phone', $phone);
        }

        $count = $this->applyBranchFilter($query, $request)->count();
        return response()->json(['count' => $count]);
    }

    /**
     * Services Endpoints.
     */
    public function getServices()
    {
        $userId = $this->currentUserId();
        $query = Service::where('user_id', $userId);
        if (Schema::hasColumn('services', 'active')) {
            $query->where('active', true);
        }

        return response()->json($query->orderBy('price', 'asc')->get());
    }

    public function createService(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'desc' => 'nullable|string',
            'price' => 'required|integer',
            'duration' => 'required|integer',
            'staff' => 'nullable|integer|min:1',
            'icon' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'service_charge_rate' => 'nullable|numeric|min:0|max:100',
            'products' => 'nullable|array',
        ]);

        $userId = $this->currentUserId();
        
        $branchId = $request->input('branch_id', $this->defaultBranchId());

        $exists = \App\Models\Service::where('user_id', $userId)
            ->where('branch_id', $branchId)
            ->where('name', $validated['name'])
            ->exists();
            
        if ($exists) {
            return response()->json(['message' => 'A service with this name already exists.'], 422);
        }

        // Products share the GST-inclusive price (after GST and service charge) equally — see ServicePricing
        $scRate = isset($validated['service_charge_rate']) ? (float) $validated['service_charge_rate'] : null;
        $validated['products'] = ServicePricing::allocateProducts(
            $validated['products'] ?? [], (float) $validated['price'], CompanySetting::where('user_id', $userId)->first(), $scRate
        );

        $service = Service::create(array_merge($validated, [
            'branch_id' => $this->defaultBranchId(),
            'user_id' => $userId,
            'active' => true,
        ]));

        return response()->json($service, 201);
    }

    public function updateService(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'desc' => 'nullable|string',
            'price' => 'required|integer',
            'duration' => 'required|integer',
            'staff' => 'nullable|integer|min:1',
            'icon' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'service_charge_rate' => 'nullable|numeric|min:0|max:100',
            'products' => 'nullable|array',
        ]);

        $userId = $this->currentUserId();
        $service = $this->applyBranchFilter(Service::where('user_id', $userId), request())->findOrFail($id);
        
        $exists = \App\Models\Service::where('user_id', $userId)
            ->where('branch_id', $service->branch_id)
            ->where('name', $validated['name'])
            ->where('id', '!=', $id)
            ->exists();
            
        if ($exists) {
            return response()->json(['message' => 'Another service with this name already exists.'], 422);
        }

        // Products share the GST-inclusive price (after GST and service charge) equally — see ServicePricing
        $scRate = isset($validated['service_charge_rate']) ? (float) $validated['service_charge_rate'] : (float) ($service->service_charge_rate ?? 0);
        $validated['products'] = ServicePricing::allocateProducts(
            $validated['products'] ?? [], (float) $validated['price'], CompanySetting::where('user_id', $userId)->first(), $scRate
        );

        $service->update($validated);

        return response()->json($service);
    }

    public function deleteService($id)
    {
        $userId = $this->currentUserId();
        $service = $this->applyBranchFilter(Service::where('user_id', $userId), request())->findOrFail($id);
        $service->delete();

        return response()->json(['status' => 'success']);
    }

    /**
     * Staff CRUD Endpoints.
     */
    public function getStaff(Request $request)
    {
        $userId = $this->currentUserId();
        $date = $request->query('date', today()->toDateString());

        $query = Staff::where('user_id', $userId);
        $query = $this->applyBranchFilter($query, $request);
        $staffList = $query->orderBy('name', 'asc')->get();

        // Fetch attendance records for this date
        $attendance = StaffAttendance::where('user_id', $userId)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('staff_id');

        $now = now();
        $expenses = \App\Models\Expense::where('user_id', $userId)
            ->where('category', 'staff_salary')
            ->whereYear('expense_date', $now->year)
            ->whereMonth('expense_date', $now->month)
            ->selectRaw('ref_id, SUM(amount) as total_paid')
            ->groupBy('ref_id')
            ->pluck('total_paid', 'ref_id');

        // Attach attendance status to each staff member
        foreach ($staffList as $staff) {
            $staff->paid_this_month = $expenses[$staff->id] ?? 0;
            if (isset($attendance[$staff->id])) {
                $staff->attendance = $attendance[$staff->id]->status;
                $staff->check_in_time = $attendance[$staff->id]->check_in_time;
                $staff->check_out_time = $attendance[$staff->id]->check_out_time;
            } else {
                $staff->attendance = 'absent';
                $staff->check_in_time = null;
                $staff->check_out_time = null;
            }
        }

        return response()->json($staffList);
    }

    public function createStaff(Request $request)
    {
        if (Auth::user()?->role === 'manager') {
            return response()->json(['message' => 'Managers are not allowed to create staff members.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'employee_id' => 'nullable|string|max:255',
            'native_place' => 'nullable|string|max:255',
            'gender' => 'nullable|string|max:255',
            'age' => 'nullable|integer',
            'marital_status' => 'nullable|string|max:255',
            'highest_education' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:255',
            'branch' => 'required|string|max:255',
            'shift' => 'required|string|max:255',
            'attendance' => 'required|string|max:255',
            'base_salary' => 'nullable|integer',
            'role' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'joined_at' => 'nullable|date',
            'date' => 'nullable|date',
        ]);

        $userId = $this->currentUserId();
        
        if (!empty($validated['employee_id'])) {
            $exists = \App\Models\Staff::where('user_id', $userId)
                ->where('employee_id', $validated['employee_id'])
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'A staff member with this Employee ID already exists.'], 422);
            }
        }

        $staffData = $validated;
        unset($staffData['date']);
        $staffData['user_id'] = $userId;
        $staffData['base_salary'] = $validated['base_salary'] ?? 0;
        if (! Schema::hasColumn('staff', 'role')) {
            unset($staffData['role']);
        }
        if (! Schema::hasColumn('staff', 'is_active')) {
            unset($staffData['is_active']);
        }
        if (! Schema::hasColumn('staff', 'joined_at')) {
            unset($staffData['joined_at']);
        }

        $staff = Staff::create($staffData);
        $staff->update(['branch_id' => $this->defaultBranchId()]);

        // Auto-create/sync User account if role is manager
        if (isset($validated['role']) && $validated['role'] === 'manager') {
            $email = $request->input('email') ?: ($validated['phone'] . '@carwash.local');
            $branch = $this->applyBranchFilter(\App\Models\Branch::where('user_id', $userId), request())->where('name', $validated['branch'])->first();
            $pass = $request->input('password') ?: 'password123';
            \App\Models\User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $validated['name'],
                    'password' => \Illuminate\Support\Facades\Hash::make($pass),
                    'role' => 'manager',
                    'owner_id' => $userId,
                    'assigned_branch_id' => $branch ? $branch->id : null
                ]
            );
        }
        // Record attendance for selected date
        $date = $request->input('date') ?: today()->toDateString();
        StaffAttendance::updateOrCreate(
            ['user_id' => $userId, 'staff_id' => $staff->id, 'date' => $date],
            ['status' => $validated['attendance']]
        );

        $staff->attendance = $validated['attendance'];

        return response()->json($staff, 201);
    }

    public function updateStaff(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'employee_id' => 'nullable|string|max:255',
            'native_place' => 'nullable|string|max:255',
            'gender' => 'nullable|string|max:255',
            'age' => 'nullable|integer',
            'marital_status' => 'nullable|string|max:255',
            'highest_education' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:255',
            'branch' => 'required|string|max:255',
            'shift' => 'required|string|max:255',
            'attendance' => 'required|string|max:255',
            'base_salary' => 'nullable|integer',
            'role' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'joined_at' => 'nullable|date',
            'date' => 'nullable|date',
        ]);

        $userId = $this->currentUserId();
        
        if (!empty($validated['employee_id'])) {
            $exists = \App\Models\Staff::where('user_id', $userId)
                ->where('employee_id', $validated['employee_id'])
                ->where('id', '!=', $id)
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'Another staff member with this Employee ID already exists.'], 422);
            }
        }

        $staff = $this->applyBranchFilter(Staff::where('user_id', $userId), request())->findOrFail($id);

        $date = $request->input('date') ?: today()->toDateString();
        $status = $validated['attendance'];

        // Save to staff_attendance table
        StaffAttendance::updateOrCreate(
            ['user_id' => $userId, 'staff_id' => $staff->id, 'date' => $date],
            ['status' => $status]
        );

        $staffData = $validated;
        unset($staffData['date']);
        if (! Schema::hasColumn('staff', 'role')) {
            unset($staffData['role']);
        }
        if (! Schema::hasColumn('staff', 'is_active')) {
            unset($staffData['is_active']);
        }
        if (! Schema::hasColumn('staff', 'joined_at')) {
            unset($staffData['joined_at']);
        }
        $staff->update($staffData);

        // Auto-create/sync User account if role is manager
        if (isset($validated['role']) && $validated['role'] === 'manager') {
            $email = $request->input('email') ?: ($validated['phone'] . '@carwash.local');
            $branch = $this->applyBranchFilter(\App\Models\Branch::where('user_id', $userId), request())->where('name', $validated['branch'])->first();
            
            $user = \App\Models\User::where('owner_id', $userId)
                        ->where(function($q) use ($email, $validated) {
                            $q->where('email', $email)
                              ->orWhere('name', $validated['name']);
                        })
                        ->where('role', 'manager')
                        ->first();
            
            $pass = $request->input('password') ?: null;
            if ($user) {
                $updateData = [
                    'name' => $validated['name'],
                    'email' => $email,
                    'assigned_branch_id' => $branch ? $branch->id : null
                ];
                if ($pass) {
                    $updateData['password'] = \Illuminate\Support\Facades\Hash::make($pass);
                }
                $user->update($updateData);
            } else {
                \App\Models\User::create([
                    'name' => $validated['name'],
                    'email' => $email,
                    'password' => \Illuminate\Support\Facades\Hash::make($pass ?: 'password123'),
                    'role' => 'manager',
                    'owner_id' => $userId,
                    'assigned_branch_id' => $branch ? $branch->id : null
                ]);
            }
        }
        // Return status matching date
        $staff->attendance = $status;

        return response()->json($staff);
    }

    public function bulkUpdateAttendance(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'attendance' => 'required|array',
            'attendance.*.id' => 'required|integer',
            'attendance.*.status' => 'required|string|in:present,absent,half-day,late',
            'attendance.*.check_in_time' => 'nullable|string',
            'attendance.*.check_out_time' => 'nullable|string',
        ]);

        $userId = $this->currentUserId();
        $date = $validated['date'];

        foreach ($validated['attendance'] as $item) {
            // Update staff_attendance log
            $inTime = (!empty($item['check_in_time'])) ? $item['check_in_time'] : null;
            $outTime = (!empty($item['check_out_time'])) ? $item['check_out_time'] : null;

            StaffAttendance::updateOrCreate(
                ['user_id' => $userId, 'staff_id' => $item['id'], 'date' => $date],
                [
                    'status' => $item['status'],
                    'check_in_time' => $inTime,
                    'check_out_time' => $outTime,
                ]
            );

            // Also sync to staff fallback column
            Staff::where('user_id', $userId)
                ->where('id', $item['id'])
                ->update(['attendance' => $item['status']]);
        }

        return response()->json(['message' => 'Attendance updated successfully']);
    }

    public function deleteStaff($id)
    {
        if (Auth::user()?->role === 'manager') {
            return response()->json(['message' => 'Managers are not allowed to delete staff members.'], 403);
        }

        $userId = $this->currentUserId();
        
        if (!empty($validated['employee_id'])) {
            $exists = \App\Models\Staff::where('user_id', $userId)
                ->where('employee_id', $validated['employee_id'])
                ->where('id', '!=', $id)
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'Another staff member with this Employee ID already exists.'], 422);
            }
        }

        $staff = $this->applyBranchFilter(Staff::where('user_id', $userId), request())->findOrFail($id);
        
        // If this staff member was a manager, also delete their login account
        if ($staff->role === 'manager') {
            $userQuery = \App\Models\User::where('owner_id', $userId)->where('role', 'manager');
            if ($staff->email) {
                $userQuery->where('email', $staff->email);
            } else {
                $userQuery->where('name', $staff->name);
            }
            $userQuery->delete();
        }
        
        $staff->delete();

        return response()->json(['status' => 'success']);
    }

    public function getStaffMonthlyAttendance(Request $request, $id)
    {
        $userId = $this->currentUserId();
        
        if (!empty($validated['employee_id'])) {
            $exists = \App\Models\Staff::where('user_id', $userId)
                ->where('employee_id', $validated['employee_id'])
                ->where('id', '!=', $id)
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'Another staff member with this Employee ID already exists.'], 422);
            }
        }

        $staff = $this->applyBranchFilter(Staff::where('user_id', $userId), request())->findOrFail($id);

        // e.g. "2026-08"
        $month = $request->query('month', today()->format('Y-m'));

        $records = StaffAttendance::where('user_id', $userId)
            ->where('staff_id', $staff->id)
            ->where('date', 'like', $month.'-%')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json($records);
    }

    /**
     * Expenses CRUD Endpoints.
     */
    public function getExpenses(Request $request)
    {
        $userId = $this->currentUserId();
        $query = Expense::where('user_id', $userId);
        $query = $this->applyBranchFilter($query, $request);
        return response()->json($query->orderBy('expense_date', 'desc')->get());
    }

    public function createExpense(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'amount' => 'required|integer',
            'expense_date' => 'required|date',
            'notes' => 'nullable|string',
            'branch_id' => 'nullable|integer',
            'ref_id' => 'nullable|integer',
        ]);

        $userId = $this->currentUserId();
        $validated['user_id'] = $userId;

        $expense = Expense::create($validated);
        $expense->update(['branch_id' => $this->defaultBranchId()]);

        return response()->json($expense, 201);
    }

    public function updateExpense(Request $request, $id)
    {
        $validated = $request->validate([
            'category' => 'nullable|string|max:255',
            'name' => 'nullable|string|max:255',
            'amount' => 'nullable|integer',
            'expense_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'branch_id' => 'nullable|integer',
            'ref_id' => 'nullable|integer',
        ]);

        $userId = $this->currentUserId();
        $expense = $this->applyBranchFilter(Expense::where('user_id', $userId), request())->findOrFail($id);

        if (! Schema::hasColumn('expenses', 'branch_id')) {
            unset($validated['branch_id']);
        }
        
        $expense->update($validated);
        return response()->json($expense);
    }

    public function deleteExpense($id)
    {
        $userId = $this->currentUserId();
        $expense = $this->applyBranchFilter(Expense::where('user_id', $userId), request())->findOrFail($id);
        $expense->delete();

        return response()->json(['status' => 'success']);
    }

    /**
     * Inventory CRUD Endpoints.
     */
    public function getInventory(Request $request)
    {
        $userId = $this->currentUserId();
        $query = InventoryItem::where('user_id', $userId);
        $query = $this->applyBranchFilter($query, $request);
        return response()->json($query->orderBy('name', 'asc')->get());
    }

    public function createInventory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'stock' => 'required|integer',
            'reorder' => 'nullable|integer',
            'supplier' => 'nullable|string|max:255',
            'unit_cost' => 'nullable|integer',
            'unit' => 'nullable|string|max:255',
            'low_stock_alert' => 'nullable|boolean',
            'active' => 'nullable|boolean',
        ]);

        $userId = $this->currentUserId();
        $itemData = $validated;
        $itemData['user_id'] = $userId;
        $itemData['unit_cost'] = $validated['unit_cost'] ?? 0;
        $itemData['icon'] = $validated['icon'] ?? 'ti-box';
        $itemData['reorder'] = $validated['reorder'] ?? 5;
        $itemData['supplier'] = $validated['supplier'] ?? 'General';
        $itemData['description'] = $validated['description'] ?? null;

        if (Schema::hasColumn('inventory_items', 'unit')) {
            $itemData['unit'] = $validated['unit'] ?? 'pcs';
        } else {
            unset($itemData['unit']);
        }

        if (Schema::hasColumn('inventory_items', 'low_stock_alert')) {
            $itemData['low_stock_alert'] = $validated['low_stock_alert'] ?? true;
        } else {
            unset($itemData['low_stock_alert']);
        }

        if (Schema::hasColumn('inventory_items', 'active')) {
            $itemData['active'] = $validated['active'] ?? true;
        } else {
            unset($itemData['active']);
        }

        $item = InventoryItem::create($itemData);
        $item->update(['branch_id' => $this->defaultBranchId()]);

        // Auto-generate expense entry for inventory purchases
        $totalCost = $item->stock * $item->unit_cost;
        if ($totalCost > 0) {
            Expense::create([
                'user_id' => $userId,
                'category' => 'inventory',
                'name' => 'Purchase: '.$item->name,
                'amount' => $totalCost,
                'expense_date' => now()->toDateString(),
                'notes' => 'Auto-generated expense from inventory purchase order (Stock: '.$item->stock.' @ Rs. '.$item->unit_cost.'/unit). Supplier: '.$item->supplier,
                'ref_id' => $item->id,
            ]);
        }

        return response()->json($item, 201);
    }

    public function updateInventory(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'stock' => 'required|integer',
            'reorder' => 'nullable|integer',
            'supplier' => 'nullable|string|max:255',
            'unit_cost' => 'nullable|integer',
            'unit' => 'nullable|string|max:255',
            'low_stock_alert' => 'nullable|boolean',
            'active' => 'nullable|boolean',
        ]);

        $userId = $this->currentUserId();
        $item = $this->applyBranchFilter(InventoryItem::where('user_id', $userId), request())->findOrFail($id);
        if (! Schema::hasColumn('inventory_items', 'unit')) {
            unset($validated['unit']);
        }
        if (! Schema::hasColumn('inventory_items', 'low_stock_alert')) {
            unset($validated['low_stock_alert']);
        }
        if (! Schema::hasColumn('inventory_items', 'active')) {
            unset($validated['active']);
        }
        $item->update($validated);

        return response()->json($item);
    }

    public function deleteInventory($id)
    {
        $userId = $this->currentUserId();
        $item = $this->applyBranchFilter(InventoryItem::where('user_id', $userId), request())->findOrFail($id);
        $item->delete();

        return response()->json(['status' => 'success']);
    }

    /**
     * Job Cards Endpoints.
     */
    public function getJobCards(Request $request)
    {
        $userId = $this->currentUserId();
        $query = JobCard::with('invoice')
            ->where('user_id', $userId)
            ->where(function ($query) {
                $query->whereNull('booking_id')
                    ->orWhereIn('booking_id', function ($q) {
                        $q->select('id')->from('bookings');
                    });
            });
        $query = $this->applyBranchFilter($query, $request);
        $cards = $query->orderBy('id', 'desc')->get();

        // Notes written on the original booking, shown when the job card has no note of its own
        $bookingNotes = Booking::whereIn('id', $cards->pluck('booking_id')->filter())->pluck('notes', 'id');
        foreach ($cards as $card) {
            $card->booking_notes = $card->booking_id ? ($bookingNotes[$card->booking_id] ?? null) : null;
        }

        return response()->json($cards);
    }

    public function createJobCard(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => 'nullable|integer|exists:bookings,id',
            'customer' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'vehicle' => 'required|string|max:255',
            'service' => 'required|string|max:255',
            'staff' => 'required|string|max:255',
            'bay' => 'nullable|string|max:255',
            'note' => 'nullable|string',
            'branch_id' => 'nullable|integer|exists:branches,id',
        ]);

        $userId = $this->currentUserId();
        
        if (!empty($validated['vehicle'])) {
            $existingJc = \App\Models\JobCard::where('user_id', $userId)
                ->whereIn('stage', ['assigned', 'inprogress'])
                ->where('vehicle', $validated['vehicle'])
                ->exists();
            if ($existingJc) {
                return response()->json(['message' => 'Vehicle already in queue'], 422);
            }
        }
        
        $booking = null;
        if (! empty($validated['booking_id'])) {
            $booking = Booking::where('user_id', $userId)->find($validated['booking_id']);
        }

        $latestJobCard = JobCard::where('user_id', $userId)
            ->orderBy('id', 'desc')
            ->first();

        $checklist = [];
        if ($latestJobCard && is_array($latestJobCard->checklist)) {
            foreach ($latestJobCard->checklist as $item) {
                $label = is_array($item) ? ($item['label'] ?? '') : $item;
                if (!empty($label)) {
                    $checklist[] = ['label' => $label, 'done' => false];
                }
            }
        }

        $cardData = [
            'id' => $this->nextJobCardId(),
            'user_id' => $userId,
            'vehicle' => $validated['vehicle'],
            'service' => $validated['service'],
            'staff' => $validated['staff'],
            'bay' => $validated['bay'] ?? '',
            'stage' => 'assigned',
            'started_at' => now()->format('H:i'),
            'checklist' => $checklist,
            'note' => $validated['note'] ?? '',
            'photos' => 0,
        ];

        if (Schema::hasColumn('job_cards', 'booking_id')) {
            $cardData['booking_id'] = $validated['booking_id'] ?? null;
        }
        if (Schema::hasColumn('job_cards', 'customer')) {
            $cardData['customer'] = $validated['customer'] ?? ($booking->customer ?? null);
        }
        if (Schema::hasColumn('job_cards', 'phone')) {
            $cardData['phone'] = $validated['phone'] ?? ($booking->phone ?? null);
        }
        if (Schema::hasColumn('job_cards', 'branch_id')) {
            $cardData['branch_id'] = $validated['branch_id'] ?? ($booking->branch_id ?? $this->defaultBranchId());
        }

        if (Schema::hasColumn('job_cards', 'started_at_at')) {
            $cardData['started_at_at'] = now();
        }

        $card = JobCard::create($cardData);

        if ($booking) {
            $booking->update(['status' => 'inprogress']);
            
            $bookingPhotos = glob(public_path("uploads/bookings/bk_{$booking->id}_before_*.jpg"));
            if ($bookingPhotos && count($bookingPhotos) > 0) {
                $card->photos_before = count($bookingPhotos);
                $card->save();
                
                $uploadDir = public_path('uploads/jobcards');
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                
                foreach ($bookingPhotos as $index => $photoPath) {
                    $idx = $index + 1;
                    $destPath = $uploadDir . "/jc_{$card->id}_before_{$idx}.jpg";
                    copy($photoPath, $destPath);
                }
            }
        }

        return response()->json($card, 201);
    }

    public function updateJobCard(Request $request, $id)
    {
        $validated = $request->validate([
            'stage' => 'nullable|string|max:255',
            'checklist' => 'nullable|array',
            'note' => 'nullable|string',
            'signed_off_by' => 'nullable|string',
            'signed_off_time' => 'nullable|string',
            'photos' => 'nullable|integer',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'customer' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'vehicle' => 'nullable|string|max:255',
            'service' => 'nullable|string|max:255',
            'staff' => 'nullable|string|max:255',
            'bay' => 'nullable|string|max:255',
        ]);

        $userId = $this->currentUserId();
        $card = $this->applyBranchFilter(JobCard::where('user_id', $userId), request())->findOrFail($id);
        
        $newStage = $validated['stage'] ?? $card->stage;
        $newBay = $validated['bay'] ?? $card->bay;

        if ($newStage === 'inprogress' && !empty($newBay)) {
            $activeWashes = JobCard::where('user_id', $userId)
                ->where('bay', $newBay)
                ->where('stage', 'inprogress')
                ->where('id', '!=', $card->id)
                ->exists();

            if ($activeWashes) {
                return response()->json(['message' => "Another vehicle is currently washing in {$newBay}. Please wait until it is completed."], 422);
            }
        }

        $wasCompleted = $card->stage === 'completed';
        if (($validated['stage'] ?? null) === 'completed' && Schema::hasColumn('job_cards', 'completed_at_at') && ! $card->completed_at_at) {
            $validated['completed_at_at'] = now();
        }

        if (! Schema::hasColumn('job_cards', 'branch_id')) {
            unset($validated['branch_id']);
        }
        if (! Schema::hasColumn('job_cards', 'started_at_at')) {
            unset($validated['started_at_at']);
        }
        if (! Schema::hasColumn('job_cards', 'completed_at_at')) {
            unset($validated['completed_at_at']);
        }

        $card->update($validated);
        $freshCard = $card->fresh();

        // Sync linked booking status
        $linkedBooking = null;
        if (! empty($freshCard->booking_id)) {
            $linkedBooking = Booking::where('user_id', $userId)->find($freshCard->booking_id);
        }
        if (! $linkedBooking && ! empty($freshCard->phone) && ! empty($freshCard->vehicle)) {
            // Extract the plate from the vehicle string (e.g. "KL90445 (Sedan)")
            $plate = explode(' ', $freshCard->vehicle)[0];
            $linkedBooking = $this->applyBranchFilter(Booking::where('user_id', $userId), request())
                ->where('phone', $freshCard->phone)
                ->where('vehicle_plate', $plate)
                ->orderByDesc('id')
                ->first();
        }

        if ($linkedBooking && isset($validated['stage'])) {
            $newBookingStatus = match ($validated['stage']) {
                'completed' => 'completed',
                'inprogress', 'assigned' => 'inprogress',
                'cancelled' => 'cancelled',
                default => null,
            };
            if ($newBookingStatus) {
                $linkedBooking->update(['status' => $newBookingStatus]);
            }
        }

        $billingInvoice = null;

        if (($validated['stage'] ?? null) === 'completed' && ! $wasCompleted) {
            $billingInvoice = $this->createBillingInvoiceForJobCard($freshCard);
            
            // Send WhatsApp message if phone is provided
            if (filled($freshCard->phone) && class_exists('\App\Models\WhatsappChat')) {
                $customerName = $freshCard->customer ?: 'Customer';
                $initials = \Illuminate\Support\Str::of($customerName)->trim()->explode(' ')->map(fn ($part) => \Illuminate\Support\Str::upper(\Illuminate\Support\Str::substr($part, 0, 1)))->join('');
                
                \App\Models\WhatsappChat::create([
                    'user_id' => $userId,
                    'name' => $customerName,
                    'customer_id' => \App\Models\Customer::where('phone', $freshCard->phone)->value('id'),
                    'branch_id' => $freshCard->branch_id,
                    'initials' => $initials,
                    'msg' => 'Hello ' . $customerName . ', your vehicle (' . $freshCard->vehicle . ') has been professionally washed and is ready for pickup.',
                    'time' => 'just now',
                    'phone' => $freshCard->phone,
                    'opt_in' => true,
                ]);
            }

            // Check if any appointment reminder was waiting for this job card completion
            $this->checkAndGenerateAppointmentReminders($userId, request());
        }

        if ($billingInvoice) {
            $freshCard->setAttribute('billing_invoice', $this->invoiceSummary($billingInvoice));
        }

        return response()->json($freshCard);
    }

    public function uploadJobCardPhoto(Request $request, $id)
    {
        $userId = $this->currentUserId();
        $card = $this->applyBranchFilter(JobCard::where('user_id', $userId), request())->findOrFail($id);

        $request->validate([
            'photo' => 'required|image|max:10240',
        ]);

        if ($request->hasFile('photo')) {
            $type = $request->input('type');
            
            if ($type === 'before') {
                $nextIndex = $card->photos_before + 1;
                $filename = "jc_{$card->id}_before_{$nextIndex}.jpg";
                $card->photos_before = $nextIndex;
            } elseif ($type === 'after') {
                $nextIndex = $card->photos_after + 1;
                $filename = "jc_{$card->id}_after_{$nextIndex}.jpg";
                $card->photos_after = $nextIndex;
            } else {
                // Fallback for Flutter app or simple uploads
                $nextIndex = $card->photos + 1;
                $filename = "jc_{$card->id}_{$nextIndex}.jpg";
                $card->photos = $nextIndex;
            }

            $dir = public_path('uploads/jobcards');
            if (! file_exists($dir)) {
                mkdir($dir, 0755, true);
            }

            $request->file('photo')->move($dir, $filename);
            $card->save();

            return response()->json($card);
        }

        return response()->json(['error' => 'No file uploaded'], 400);
    }

    /**
     * Invoices / Payments Endpoints.
     */
    public function getInvoices(Request $request)
    {
        $userId = $this->currentUserId();
        $query = Invoice::where('user_id', $userId);
        $query = $this->applyBranchFilter($query, $request);
        $invoices = $query->orderBy('id', 'desc')->get();

        $jobCards = \App\Models\JobCard::where('user_id', $userId)
                ->where('stage', 'completed')
                ->pluck('vehicle');

        $lastWashByPlate = Vehicle::where('user_id', $userId)
                ->whereNotNull('plate')
                ->get(['plate', 'last_wash'])
                ->mapWithKeys(fn ($v) => [strtolower($v->plate) => $v->last_wash]);

        $services = Service::where('user_id', $userId)->get(['name', 'products']);
        $servicesMap = [];
        foreach ($services as $s) {
            $servicesMap[strtolower(trim($s->name))] = $s->products ?: [];
        }

        foreach ($invoices as $inv) {
            $count = 0;
            $lastWash = null;
            if (!empty($inv->vehicle)) {
                $plate = explode(' ', $inv->vehicle)[0];
                foreach ($jobCards as $jcVehicle) {
                    if (stripos($jcVehicle, $plate) !== false) {
                        $count++;
                    }
                }
                $lastWash = $lastWashByPlate[strtolower($plate)] ?? null;
            }
            $inv->loyalty_count = $count;
            $inv->last_wash = $lastWash ?: $inv->date;

            $serviceProducts = [];
            $productsTotal = 0;
            if (!empty($inv->service)) {
                $serviceNames = array_map('trim', explode(',', $inv->service));
                foreach ($serviceNames as $sName) {
                    $key = strtolower(trim($sName));
                    if (isset($servicesMap[$key]) && is_array($servicesMap[$key])) {
                        foreach ($servicesMap[$key] as $sp) {
                            $serviceProducts[] = $sp;
                            $rawQty = (string) ($sp['quantity'] ?? 1);
                            $isPct = str_contains($rawQty, '%');
                            $pQty = $isPct ? 1.0 : (float) $rawQty;
                            $pRate = (float) ($sp['price'] ?? 0);
                            $productsTotal += ($pQty * $pRate);
                        }
                    }
                }
            }
            // Products are a breakdown of the service price (already inside the subtotal), never an extra charge
            $inv->service_products = $serviceProducts;
            $inv->products_total = $productsTotal;
        }

        return response()->json($invoices);
    }

    public function createInvoice(Request $request)
    {
        $validated = $request->validate([
            'customer' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'service' => 'required|string|max:255',
            'amount' => 'required_without:subtotal|numeric|min:0',
            'subtotal' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'method' => 'required|string|max:255',
            'status' => 'required|string|max:255',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'payment_reference' => 'nullable|string|max:255',
            'due_at' => 'nullable|date',
            'paid_at' => 'nullable|date',
        ]);

        $userId = $this->currentUserId();
        $invoiceNumber = $this->nextInvoiceNumber();
        // The entered price is the final GST-inclusive amount; tax and total are worked out by InvoiceCalculator
        $subtotal = round((float) ($validated['subtotal'] ?? $validated['amount'] ?? 0), 2);
        $taxRate = isset($validated['tax_rate']) ? (float) $validated['tax_rate'] : 18;
        $discountAmount = (int) round($validated['discount_amount'] ?? 0);

        $invoice = new Invoice([
            'id' => $invoiceNumber,
            'user_id' => $userId,
            'invoice_number' => $invoiceNumber,
            'branch_id' => $validated['branch_id'] ?? $this->defaultBranchId(),
            'customer' => $validated['customer'],
            'phone' => $validated['phone'],
            'service' => $validated['service'],
            'subtotal' => $subtotal,
            'amount' => $subtotal,
            'tax_rate' => $taxRate,
            'tax_amount' => 0,
            'discount_amount' => $discountAmount,
            'method' => $validated['method'],
            'status' => $validated['status'],
            'payment_reference' => $validated['payment_reference'] ?? null,
            'payment_status' => $validated['status'],
            'date' => date('d M Y'),
            'paid_at' => $validated['status'] === 'paid' ? ($validated['paid_at'] ?? now()) : null,
            'due_at' => $validated['due_at'] ?? ($validated['status'] === 'pending' ? now()->addDays(7) : null),
        ]);
        if (Schema::hasColumn('invoices', 'tax_inclusive')) {
            $invoice->tax_inclusive = true;
        }
        InvoiceCalculator::applyTo($invoice)->save();

        return response()->json($invoice, 201);
    }

    public function updateInvoice(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:255',
            'payment_status' => 'nullable|string|max:255',
            'method' => 'nullable|string|max:255',
            'payment_reference' => 'nullable|string|max:255',
            'paid_at' => 'nullable|date',
            'due_at' => 'nullable|date',
            'discount_amount' => 'nullable|integer',
            'amount' => 'nullable|integer',
            'split_cash' => 'nullable|numeric',
            'split_upi' => 'nullable|numeric',
            'date' => 'nullable|string',
            'item_name' => 'nullable|string|max:255',
            'item_price' => 'nullable|integer',
            'item_quantity' => 'nullable|integer|min:1',
        ]);

        $userId = $this->currentUserId();
        $invoice = $this->applyBranchFilter(Invoice::where('user_id', $userId), request())->findOrFail($id);

        if (isset($validated['status'])) {
            $invoice->status = $validated['status'];
            $invoice->payment_status = $validated['status'];
            if ($validated['status'] === 'paid' && ! $invoice->paid_at) {
                $invoice->paid_at = $validated['paid_at'] ?? now();
            }
        }

        if (isset($validated['payment_status'])) {
            $invoice->payment_status = $validated['payment_status'];
            $invoice->status = $validated['payment_status'];
            if ($validated['payment_status'] === 'paid' && ! $invoice->paid_at) {
                $invoice->paid_at = $validated['paid_at'] ?? now();
            }
        }

        if (isset($validated['method'])) {
            $invoice->method = $validated['method'];
        }

        if (array_key_exists('payment_reference', $validated)) {
            $invoice->payment_reference = $validated['payment_reference'];
        }
        
        if (array_key_exists('split_cash', $validated)) {
            $invoice->split_cash = $validated['split_cash'];
        }

        if (array_key_exists('split_upi', $validated)) {
            $invoice->split_upi = $validated['split_upi'];
        }

        if (array_key_exists('discount_amount', $validated)) {
            $invoice->discount_amount = $validated['discount_amount'];
        }
        
        if (array_key_exists('amount', $validated)) {
            $invoice->amount = $validated['amount'];
        }

        if (array_key_exists('due_at', $validated)) {
            $invoice->due_at = $validated['due_at'];
        }

        if (array_key_exists('paid_at', $validated)) {
            $invoice->paid_at = $validated['paid_at'];
        }

        if (isset($validated['date'])) {
            $invoice->date = $validated['date'];
        }
        if (array_key_exists('item_name', $validated)) {
            $invoice->item_name = $validated['item_name'];
        }
        if (array_key_exists('item_price', $validated)) {
            $invoice->item_price = $validated['item_price'];
        }
        if (array_key_exists('item_quantity', $validated)) {
            $invoice->item_quantity = max(1, (int) $validated['item_quantity']);
        }

        // Recalculate tax and total with the same maths as the preview and printed invoice
        InvoiceCalculator::applyTo($invoice);

        $invoice->save();

        return response()->json($invoice);
    }

    public function deleteInvoice($id)
    {
        $userId = $this->currentUserId();
        $invoice = $this->applyBranchFilter(Invoice::where('user_id', $userId), request())->findOrFail($id);
        $invoice->delete();

        return response()->json(['status' => 'success']);
    }

    private function createBillingInvoiceForJobCard(JobCard $card): ?Invoice
    {
        $userId = $card->user_id ?? $this->currentUserId();
        if (Schema::hasColumn('job_cards', 'invoice_id') && filled($card->invoice_id)) {
            $existing = Invoice::where('user_id', $userId)->find($card->invoice_id);
            if ($existing) {
                return $existing;
            }
        }

        if (Schema::hasColumn('invoices', 'job_card_id')) {
            $existing = $this->applyBranchFilter(Invoice::where('user_id', $userId), request())->where('job_card_id', $card->id)->first();
            if ($existing) {
                if (Schema::hasColumn('job_cards', 'invoice_id') && ! filled($card->invoice_id)) {
                    $card->forceFill(['invoice_id' => $existing->id])->save();
                }

                return $existing;
            }
        }

        $booking = null;
        if (Schema::hasColumn('job_cards', 'booking_id') && filled($card->booking_id)) {
            $booking = Booking::where('user_id', $userId)->find($card->booking_id);
        }

        $serviceNames = array_map('trim', explode(',', $card->service));
        $services = Service::where('user_id', $userId)->whereIn('name', $serviceNames)->get();

        $subtotal = 0;
        $taxAmount = 0;
        $taxRate = 0;

        // A service's products are a breakdown of its price, so they are not added on top of it
        if ($services->isNotEmpty()) {
            foreach ($services as $svc) {
                $subtotal += InvoiceCalculator::serviceTotal($svc);
            }
        } else {
            $service = $this->applyBranchFilter(Service::where('user_id', $userId), request())->where('name', $card->service)->first();
            $subtotal = $service ? InvoiceCalculator::serviceTotal($service) : 0;
        }
        $subtotal = round($subtotal, 2);
        $amount = $subtotal;
        $branchId = $card->branch_id ?? ($booking->branch_id ?? $this->defaultBranchId());

        $invoiceData = [
            'id' => $this->nextInvoiceNumber(),
            'user_id' => $userId,
            'customer' => $card->customer ?: ($booking->customer ?? $card->vehicle ?? 'Walk-in Customer'),
            'phone' => $card->phone ?: ($booking->phone ?? 'Not provided'),
            'service' => $card->service,
            'amount' => $amount,
            'method' => 'pending',
            'status' => 'pending',
            'date' => now()->format('d M Y'),
        ];

        if (Schema::hasColumn('invoices', 'invoice_number')) {
            $invoiceData['invoice_number'] = $invoiceData['id'];
        }
        if (Schema::hasColumn('invoices', 'job_card_id')) {
            $invoiceData['job_card_id'] = $card->id;
        }
        if (Schema::hasColumn('invoices', 'vehicle')) {
            $invoiceData['vehicle'] = $card->vehicle;
        }
        if (Schema::hasColumn('invoices', 'branch_id')) {
            $invoiceData['branch_id'] = $branchId;
        }
        if (Schema::hasColumn('invoices', 'subtotal')) {
            $invoiceData['subtotal'] = $subtotal;
        }
        if (Schema::hasColumn('invoices', 'tax_rate')) {
            $invoiceData['tax_rate'] = $taxRate;
        }
        if (Schema::hasColumn('invoices', 'tax_amount')) {
            $invoiceData['tax_amount'] = $taxAmount;
        }
        if (Schema::hasColumn('invoices', 'discount_amount')) {
            $invoiceData['discount_amount'] = 0;
        }
        if (Schema::hasColumn('invoices', 'tax_inclusive')) {
            $invoiceData['tax_inclusive'] = true;   // the service price is the final GST-inclusive amount
        }
        if (Schema::hasColumn('invoices', 'payment_reference')) {
            $invoiceData['payment_reference'] = null;
        }
        if (Schema::hasColumn('invoices', 'payment_status')) {
            $invoiceData['payment_status'] = 'pending';
        }
        if (Schema::hasColumn('invoices', 'paid_at')) {
            $invoiceData['paid_at'] = null;
        }
        if (Schema::hasColumn('invoices', 'due_at')) {
            $invoiceData['due_at'] = now()->addDays(7);
        }

        $invoice = InvoiceCalculator::applyTo(new Invoice($invoiceData));
        $invoice->save();

        if (Schema::hasColumn('job_cards', 'invoice_id')) {
            $card->forceFill(['invoice_id' => $invoice->id])->save();
        }

        $notificationData = [
            'user_id' => $userId,
            'icon' => 'report-money',
            'title' => 'Billing created for #'.$card->id,
            'time' => 'just now',
            'read' => false,
        ];

        if (Schema::hasColumn('notifications', 'type')) {
            $notificationData['type'] = 'billing_created';
        }
        if (Schema::hasColumn('notifications', 'link')) {
            $notificationData['link'] = '/payments';
        }
        if (Schema::hasColumn('notifications', 'branch_id')) {
            $notificationData['branch_id'] = $branchId;
        }

        Notification::create($notificationData);

        return $invoice;
    }

    private function invoiceSummary(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'customer' => $invoice->customer,
            'phone' => $invoice->phone,
            'service' => $invoice->service,
            'amount' => $invoice->amount,
            'subtotal' => $invoice->subtotal ?? null,
            'tax_rate' => $invoice->tax_rate ?? null,
            'tax_amount' => $invoice->tax_amount ?? null,
            'discount_amount' => $invoice->discount_amount ?? null,
            'tax_inclusive' => (bool) ($invoice->tax_inclusive ?? false),
            'branch_id' => $invoice->branch_id ?? null,
            'job_card_id' => $invoice->job_card_id ?? null,
        ];
    }

    public function createBranch(Request $request)
    {
        if (Auth::user()?->role === 'manager') {
            return response()->json(['message' => 'Managers are not allowed to create branches.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'code' => 'nullable|string|max:255',
            'gst_number' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'active' => 'nullable|boolean',
        ]);

        $userId = $this->currentUserId();
        $branch = Branch::create([
            'user_id' => $userId,
            'name' => $validated['name'],
            'code' => $validated['code'] ?? $this->branchCodeFromName($validated['name']),
            'location' => $validated['location'],
            'gst_number' => $validated['gst_number'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'city' => $validated['city'] ?? $validated['location'],
            'state' => $validated['state'] ?? 'Kerala',
            'active' => $validated['active'] ?? true,
        ]);

        return response()->json($branch, 201);
    }

    /**
     * Manager Accounts CRUD for Admin.
     */
    public function getManagers()
    {
        $adminId = Auth::id() ?: 1;
        $managers = User::where('owner_id', $adminId)
            ->where('role', 'manager')
            ->with('assignedBranch')
            ->orderBy('name')
            ->get();

        return response()->json($managers);
    }

    public function createManager(Request $request)
    {
        if (Auth::user()?->role === 'manager') {
            return response()->json(['message' => 'Managers are not allowed to create manager accounts.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'assigned_branch_id' => 'nullable|exists:branches,id',
        ]);

        $adminId = Auth::id() ?: 1;

        $manager = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'manager',
            'owner_id' => $adminId,
            'assigned_branch_id' => $validated['assigned_branch_id'] ?? null,
        ]);

        return response()->json($manager->load('assignedBranch'), 201);
    }

    public function updateManager(Request $request, $id)
    {
        if (Auth::user()?->role === 'manager') {
            return response()->json(['message' => 'Managers are not allowed to update manager accounts.'], 403);
        }

        $adminId = Auth::id() ?: 1;
        $manager = User::where('owner_id', $adminId)->where('role', 'manager')->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$manager->id,
            'password' => 'nullable|string|min:6',
            'assigned_branch_id' => 'nullable|exists:branches,id',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'assigned_branch_id' => $validated['assigned_branch_id'] ?? null,
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $manager->update($updateData);

        return response()->json($manager->load('assignedBranch'));
    }

    public function deleteManager($id)
    {
        if (Auth::user()?->role === 'manager') {
            return response()->json(['message' => 'Managers are not allowed to delete manager accounts.'], 403);
        }

        $adminId = Auth::id() ?: 1;
        $manager = User::where('owner_id', $adminId)->where('role', 'manager')->findOrFail($id);
        $manager->delete();

        return response()->json(['status' => 'success']);
    }

    private function formatTimeLabel(string $time): array
    {
        $parts = array_map('trim', explode(':', trim($time)));
        $hour = max(0, min(23, (int) ($parts[0] ?? 0)));
        $minute = max(0, min(59, (int) ($parts[1] ?? 0)));

        $minutes = ($hour * 60) + $minute;
        $suffix = $hour >= 12 ? 'PM' : 'AM';
        $h12 = $hour % 12 ?: 12;

        return [$minutes, sprintf('%d:%02d %s', $h12, $minute, $suffix)];
    }

    private function findOrCreateCustomerFromBooking(array $validated, $userId): ?Customer
    {
        $customer = null;

        if (! empty($validated['phone'])) {
            $customer = $this->applyBranchFilter(Customer::where('user_id', $userId), request())->where('phone', $validated['phone'])->first();
        }

        if (! $customer) {
            $customer = $this->applyBranchFilter(Customer::where('user_id', $userId), request())->where('name', $validated['customer'])->first();
        }

        if ($customer) {
            return $customer;
        }

        return Customer::create([
        'branch_id' => $this->defaultBranchId(),
            'user_id' => $userId,
            'name' => $validated['customer'],
            'phone' => $validated['phone'] ?? '',
            'plan' => 'none',
            'points' => 100,
            'loyalty_points' => 100,
            'district' => null,
            'last_visit' => date('d M Y'),
            'last_visit_at' => now(),
            'follow_up_due_at' => now()->addDays(14),
            'starred' => false,
            'notes' => 'Created automatically from booking appointment',
            'membership' => 'No active membership',
        ]);
    }

    private function syncVehicleFromBooking(array $validated, ?int $customerId, $userId): void
    {
        if (! $customerId || empty($validated['vehicle'])) {
            return;
        }

        $vehicleName = $validated['vehicle'];
        $vehiclePlate = ! empty($validated['vehicle_plate']) ? trim($validated['vehicle_plate']) : null;

        $query = Vehicle::where('user_id', $userId)->where('customer_id', $customerId);
        if ($vehiclePlate) {
            $vehicleExists = $query->where('plate', $vehiclePlate)->exists();
        } else {
            $vehicleExists = $query->where('brand', $vehicleName)->exists();
        }

        if ($vehicleExists) {
            return;
        }

        if ($vehiclePlate) {
            $plate = $vehiclePlate;
            $brand = $vehicleName;
        } else {
            $brand = $vehicleName;
            $cleaned = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $vehicleName));
            if (preg_match('/^KL\d{1,2}[A-Z]{1,2}\d{1,4}$/', $cleaned)) {
                $plate = $vehicleName;
                $brand = 'Unknown Vehicle';
            } else {
                $plate = 'KL-'.rand(10, 86).'-'.chr(rand(65, 90)).chr(rand(65, 90)).'-'.rand(1000, 9999);
            }
        }

        Vehicle::create([
        'branch_id' => $this->defaultBranchId(),
            'user_id' => $userId,
            'plate' => $plate,
            'customer_id' => $customerId,
            'registration_state' => $this->registrationStateFromPlate($plate),
            'brand' => $brand,
            'colour' => 'Unknown',
            'type' => $validated['vehicle_type'] ?? 'sedan',
            'fuel' => 'Petrol',
            'last_wash' => date('d M Y'),
            'next' => date('d M', strtotime('+14 days')),
            'next_service_at' => now()->addDays(14),
        ]);
    }

    private function createFollowUpNotification(Booking $booking, ?Customer $customer, $userId): void
    {
        Notification::create([
            'user_id' => $userId,
            'icon' => 'bell',
            'type' => 'booking_created',
            'title' => 'New booking for '.$booking->customer,
            'time' => 'just now',
            'read' => false,
            'link' => '/bookings',
            'branch_id' => $booking->branch_id,
        ]);

        if (! $customer) {
            return;
        }

        if (filled($customer->phone)) {
            WhatsappChat::create([
                'user_id' => $userId,
                'name' => $customer->name,
                'customer_id' => $customer->id,
                'branch_id' => $booking->branch_id,
                'initials' => Str::of($customer->name)->trim()->explode(' ')->map(fn ($part) => Str::upper(Str::substr($part, 0, 1)))->join(''),
                'msg' => 'Booking confirmed for '.$booking->time_label,
                'time' => 'just now',
                'phone' => $customer->phone,
                'opt_in' => true,
            ]);
        }
    }

    public function checkAndGenerateAppointmentReminders($userId, $request = null): void
    {
        $today = now()->toDateString();
        $dueBookings = Booking::where('user_id', $userId)
            ->whereNotNull('reminder_date')
            ->whereDate('reminder_date', '<=', $today)
            ->where('reminder_notified', false)
            ->get();

        foreach ($dueBookings as $booking) {
            // Only notify if the created appointment's job card is completed
            $jobCardCompleted = JobCard::where('user_id', $userId)
                ->where(function ($q) use ($booking) {
                    $q->where('booking_id', $booking->id);
                    if (!empty($booking->phone) && !empty($booking->vehicle_plate)) {
                        $q->orWhere(function ($sub) use ($booking) {
                            $sub->where('phone', $booking->phone)
                                ->where('vehicle', 'LIKE', $booking->vehicle_plate . '%');
                        });
                    }
                })
                ->where('stage', 'completed')
                ->exists();

            if ($jobCardCompleted) {
                $veh = $booking->vehicle_plate ?: ($booking->vehicle ?: 'Vehicle');
                $noteSnippet = filled($booking->reminder_note) ? ' · ' . $booking->reminder_note : '';
                $title = "Reminder: {$booking->customer} ({$veh}){$noteSnippet}";

                $alreadyNotified = Notification::where('user_id', $userId)
                    ->where('type', 'appointment_reminder')
                    ->where('link', '/jobcards?booking_id=' . $booking->id)
                    ->exists();

                if (! $alreadyNotified) {
                    Notification::create([
                        'user_id' => $userId,
                        'branch_id' => $booking->branch_id,
                        'icon' => 'bell-ringing',
                        'type' => 'appointment_reminder',
                        'title' => $title,
                        'time' => 'Due today',
                        'read' => false,
                        'link' => '/jobcards?booking_id=' . $booking->id,
                    ]);
                }

                $booking->update(['reminder_notified' => true]);
            }
        }
    }

    private function buildMembershipLabel(string $plan): string
    {
        return match ($plan) {
            'platinum' => 'Platinum · 4 washes remaining · Expires '.date('d M', strtotime('+30 days')).' · Auto-renew on',
            'gold' => 'Gold · 2 washes remaining · Expires '.date('d M', strtotime('+30 days')).' · Auto-renew off',
            'silver' => 'Silver · 1 wash remaining · Expires '.date('d M', strtotime('+30 days')).' · Auto-renew on',
            default => 'No active membership',
        };
    }

    private function registrationStateFromPlate(string $plate): string
    {
        $normalized = strtoupper(preg_replace('/[^A-Z0-9]/', '', $plate));

        if (Str::startsWith($normalized, 'KL')) {
            return 'KL';
        }

        return 'KL';
    }

    private function branchCodeFromName(string $name): string
    {
        $slug = Str::of($name)->upper()->replaceMatches('/[^A-Z0-9]+/', '')->substr(0, 3)->toString();
        $slug = $slug !== '' ? $slug : 'BR';

        return $slug.'-'.str_pad((string) (Branch::count() + 1), 2, '0', STR_PAD_LEFT);
    }

    private function nextJobCardId(): string
    {
        $lastCard = JobCard::orderByRaw('CAST(SUBSTR(id, 4) AS INTEGER) DESC')->value('id');
        $nextNum = 1001;

        if (is_string($lastCard) && preg_match('/JC-(\d+)/', $lastCard, $matches)) {
            $nextNum = (int) $matches[1] + 1;
        }

        return 'JC-'.$nextNum;
    }

    private function nextInvoiceNumber(): string
    {
        $period = now()->format('Ym');
        $lastInvoiceNumber = Invoice::where('invoice_number', 'like', 'INV-'.$period.'-%')
            ->orderByDesc('invoice_number')
            ->value('invoice_number');

        $nextSequence = 1;
        if (is_string($lastInvoiceNumber) && preg_match('/INV-'.$period.'-(\d+)/', $lastInvoiceNumber, $matches)) {
            $nextSequence = (int) $matches[1] + 1;
        }

        return sprintf('INV-%s-%04d', $period, $nextSequence);
    }

    private function defaultBranchId(): ?int
    {
        $user = Auth::user();
        if ($user && $user->role === 'manager' && $user->assigned_branch_id) {
            return $user->assigned_branch_id;
        }
        if (request()->filled('branch_code')) {
            $branch = Branch::where('user_id', $this->currentUserId())->where('code', request()->input('branch_code'))->first();
            if ($branch) return $branch->id;
        }
        return Branch::where('active', true)->orderBy('id')->value('id');
    }

    public function uploadStaffPhoto(Request $request, $id)
    {
        $request->validate(['photo' => 'required|image|max:2048']);
        $staff = Staff::where('user_id', $this->currentUserId())->findOrFail($id);
        
        $dir = public_path('uploads/staff/photos');
        if (!file_exists($dir)) { mkdir($dir, 0755, true); }
        $file = $request->file('photo');
        $filename = uniqid() . '.' . $file->getClientOriginalExtension();
        $file->move($dir, $filename);
        $path = 'uploads/staff/photos/' . $filename;
        
        $staff->update(['photo' => $path]);
        return response()->json(['message' => 'Photo uploaded', 'path' => $path]);
    }

    public function uploadStaffDocument(Request $request, $id)
    {
        $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'type' => 'required|string|in:id_proof,pcc'
        ]);
        $staff = Staff::where('user_id', $this->currentUserId())->findOrFail($id);
        
        $dir = public_path('uploads/staff/documents');
        if (!file_exists($dir)) { mkdir($dir, 0755, true); }
        $file = $request->file('document');
        $filename = uniqid() . '.' . $file->getClientOriginalExtension();
        $file->move($dir, $filename);
        $path = 'uploads/staff/documents/' . $filename;
        
        if ($request->input('type') === 'id_proof') {
            $staff->update(['id_proof_path' => $path]);
        } else {
            $staff->update(['pcc_certificate_path' => $path]);
        }
        return response()->json(['message' => 'Document uploaded', 'path' => $path]);
    }

    public function getBays(Request $request) {
        $userId = $this->currentUserId();
        $query = \App\Models\Bay::where('user_id', $userId);
        $query = $this->applyBranchFilter($query, $request);
        return response()->json($query->orderBy('created_at', 'asc')->get());
    }

    public function createBay(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:255'
        ]);
        
        $userId = $this->currentUserId();
        $validated['user_id'] = $userId;
        $validated['branch_id'] = $validated['branch_id'] ?? $this->defaultBranchId();

        $exists = \App\Models\Bay::where('user_id', $userId)
            ->where('branch_id', $validated['branch_id'])
            ->where('name', $validated['name'])
            ->exists();
            
        if ($exists) {
            return response()->json(['message' => 'A bay with this name already exists.'], 422);
        }

        $bay = \App\Models\Bay::create($validated);
        return response()->json($bay, 201);
    }

    public function deleteBay($id) {
        $bay = $this->applyBranchFilter(\App\Models\Bay::where('user_id', $this->currentUserId()), request())->findOrFail($id);
        $bay->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    public function getBranches()
    {
        $userId = $this->currentUserId();
        return response()->json(Branch::where('user_id', $userId)->orderBy('name')->get());
    }

    public function updateBranch(Request $request, $id)
    {
        if (Auth::user()?->role === 'manager') {
            return response()->json(['message' => 'Managers cannot edit branches.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'code' => 'nullable|string|max:255',
            'gst_number' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'active' => 'nullable|boolean',
        ]);

        $userId = $this->currentUserId();
        $branch = $this->applyBranchFilter(Branch::where('user_id', $userId), request())->findOrFail($id);
        $branch->update($validated);
        return response()->json($branch);
    }

    public function deleteBranch($id)
    {
        if (Auth::user()?->role === 'manager') {
            return response()->json(['message' => 'Managers cannot delete branches.'], 403);
        }

        $userId = $this->currentUserId();
        $branch = $this->applyBranchFilter(Branch::where('user_id', $userId), request())->findOrFail($id);
        $branch->delete();
        return response()->json(['message' => 'Branch deleted']);
    }


    public function getSettings()
    {
        $userId = $this->currentUserId();
        $settings = \App\Models\CompanySetting::firstOrCreate(['user_id' => $userId]);
        return response()->json($settings);
    }

    public function saveSettings(\Illuminate\Http\Request $request)
    {
        $userId = $this->currentUserId();
        $settings = \App\Models\CompanySetting::firstOrCreate(['user_id' => $userId]);
        
        $data = $request->except(['company_logo', 'upi_qr_code', 'signature']);
        
        if ($request->hasFile('company_logo')) {
            $file = $request->file('company_logo');
            $filename = 'logo_' . $userId . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/settings'), $filename);
            $data['company_logo'] = 'uploads/settings/' . $filename;
        }
        
        if ($request->hasFile('upi_qr_code')) {
            $file = $request->file('upi_qr_code');
            $filename = 'qr_' . $userId . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/settings'), $filename);
            $data['upi_qr_code'] = 'uploads/settings/' . $filename;
        }
        
        if ($request->hasFile('signature')) {
            $file = $request->file('signature');
            $filename = 'sig_' . $userId . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/settings'), $filename);
            $data['signature'] = 'uploads/settings/' . $filename;
        }

        $settings->update($data);
        return response()->json($settings);
    }
}