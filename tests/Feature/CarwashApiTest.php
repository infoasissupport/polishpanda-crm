<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Branch;
use App\Models\Invoice;
use App\Models\JobCard;
use App\Models\Notification;
use App\Models\Service;
use App\Models\Staff;
use App\Models\StaffAttendance;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\WhatsappChat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CarwashApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic structures needed
        User::create([
            'id' => 1,
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);
        Branch::create(['user_id' => 1, 'name' => 'Kottayam', 'location' => 'Kottayam']);
        Notification::create(['user_id' => 1, 'icon' => 'bell', 'title' => 'Test alert', 'time' => '1m ago']);
        WhatsappChat::create(['user_id' => 1, 'name' => 'Ravi', 'initials' => 'R', 'msg' => 'Hi', 'time' => '1m', 'phone' => '12345']);
        Service::create(['user_id' => 1, 'name' => 'Basic wash', 'price' => 299, 'duration' => 30, 'icon' => 'ti-wash']);
    }

    public function test_get_global_data(): void
    {
        $response = $this->getJson('/api/global');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'branches',
                'notifications',
                'whatsapp',
            ]);
    }

    public function test_get_dashboard_stats(): void
    {
        $response = $this->getJson('/api/dashboard/stats');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'todayBookings',
                'carsWaiting',
                'completedToday',
                'revenueToday',
                'revenueWeekly',
                'revenueMonthly',
                'pendingPayments',
                'pendingCount',
                'revenueChart' => [
                    'data',
                    'categories',
                ],
            ]);
    }

    public function test_bookings_crud(): void
    {
        // Get empty bookings
        $response = $this->getJson('/api/bookings');
        $response->assertStatus(200)->assertJsonCount(0);

        // Create booking
        $response = $this->postJson('/api/bookings', [
            'customer' => 'Customer Name',
            'phone' => '+91 98765 43210',
            'vehicle' => 'Hyundai i20',
            'vehicle_type' => 'hatchback',
            'service' => 'Basic wash',
            'source' => 'online',
            'status' => 'confirmed',
            'time' => '14:30',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'customer' => 'Customer Name',
                'time_label' => '2:30 PM',
                'minutes' => 870,
                'vehicle_type' => 'hatchback',
            ]);

        $bookingId = $response->json('id');

        $this->assertDatabaseHas('bookings', ['customer' => 'Customer Name', 'vehicle_type' => 'hatchback']);
        $this->assertDatabaseHas('customers', [
            'name' => 'Customer Name',
            'phone' => '+91 98765 43210',
        ]);
        $this->assertDatabaseHas('vehicles', [
            'brand' => 'Hyundai i20',
            'type' => 'hatchback',
        ]);

        // Update booking status
        $response = $this->putJson('/api/bookings/'.$bookingId, [
            'status' => 'checked_in',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'checked_in',
            ]);

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'status' => 'checked_in',
        ]);

        // Delete booking
        $response = $this->deleteJson('/api/bookings/'.$bookingId);
        $response->assertStatus(200);

        $this->assertDatabaseMissing('bookings', [
            'id' => $bookingId,
        ]);
    }

    public function test_customers_crud(): void
    {
        $response = $this->getJson('/api/customers');
        $response->assertStatus(200)->assertJsonCount(0);

        $response = $this->postJson('/api/customers', [
            'name' => 'Alice Smith',
            'phone' => '+91 99999 88888',
            'plan' => 'platinum',
            'notes' => 'Some preferences',
            'vehicles' => [
                ['brand' => 'Swift Dzire', 'plate' => 'KL-05-AB-1234'],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'name' => 'Alice Smith',
                'plan' => 'platinum',
            ]);

        $this->assertDatabaseHas('customers', ['name' => 'Alice Smith']);
        $this->assertDatabaseHas('vehicles', ['plate' => 'KL-05-AB-1234']);
    }

    public function test_staff_crud(): void
    {
        // Create staff
        $response = $this->postJson('/api/staff', [
            'name' => 'John Worker',
            'phone' => '1234567890',
            'branch' => 'Kottayam',
            'shift' => '9 AM – 6 PM',
            'attendance' => 'present',
        ]);

        $response->assertStatus(201);
        $staffId = $response->json('id');

        // Update staff
        $response = $this->putJson("/api/staff/{$staffId}", [
            'name' => 'John Worker Updated',
            'phone' => '1234567890',
            'branch' => 'Kottayam',
            'shift' => '9 AM – 6 PM',
            'attendance' => 'absent',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('staff', ['name' => 'John Worker Updated', 'attendance' => 'absent']);

        // Delete staff
        $response = $this->deleteJson("/api/staff/{$staffId}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('staff', ['id' => $staffId]);
    }

    public function test_bulk_update_staff_attendance(): void
    {
        $staff1 = Staff::create([
            'user_id' => 1,
            'name' => 'Worker One',
            'phone' => '1111111111',
            'branch' => 'Branch A',
            'shift' => 'Morning',
            'attendance' => 'absent',
        ]);
        $staff2 = Staff::create([
            'user_id' => 1,
            'name' => 'Worker Two',
            'phone' => '2222222222',
            'branch' => 'Branch A',
            'shift' => 'Morning',
            'attendance' => 'absent',
        ]);

        $response = $this->postJson('/api/staff/attendance/bulk', [
            'date' => '2026-08-07',
            'attendance' => [
                ['id' => $staff1->id, 'status' => 'present'],
                ['id' => $staff2->id, 'status' => 'present'],
            ],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('staff_attendance', [
            'staff_id' => $staff1->id,
            'date' => '2026-08-07',
            'status' => 'present',
        ]);
        $this->assertDatabaseHas('staff_attendance', [
            'staff_id' => $staff2->id,
            'date' => '2026-08-07',
            'status' => 'present',
        ]);
    }

    public function test_get_staff_monthly_attendance(): void
    {
        $staff = Staff::create([
            'user_id' => 1,
            'name' => 'Worker Calendar Test',
            'phone' => '9999999999',
            'branch' => 'Branch A',
            'shift' => 'Morning',
            'attendance' => 'present',
        ]);

        StaffAttendance::create([
            'user_id' => 1,
            'staff_id' => $staff->id,
            'date' => '2026-08-05',
            'status' => 'present',
        ]);

        StaffAttendance::create([
            'user_id' => 1,
            'staff_id' => $staff->id,
            'date' => '2026-08-06',
            'status' => 'absent',
        ]);

        $response = $this->getJson("/api/staff/{$staff->id}/attendance?month=2026-08");
        $response->assertStatus(200);
        $response->assertJsonCount(2);
        $response->assertJsonFragment(['date' => '2026-08-05', 'status' => 'present']);
        $response->assertJsonFragment(['date' => '2026-08-06', 'status' => 'absent']);
    }

    public function test_web_routes_auth_protection(): void
    {
        // Unauthenticated access must redirect to login
        $unauthDashboard = $this->get('/dashboard');
        $unauthDashboard->assertRedirect('/login');

        // Authenticated access succeeds
        $user = User::first();
        $authDashboard = $this->actingAs($user)->get('/dashboard');
        $authDashboard->assertStatus(200);
    }

    public function test_inventory_crud(): void
    {
        // Create item
        $response = $this->postJson('/api/inventory', [
            'name' => 'Polish Wax',
            'icon' => 'ti-shield',
            'stock' => 10,
            'reorder' => 5,
            'supplier' => 'Suppliers Inc.',
        ]);
        $response->assertStatus(201);
        $itemId = $response->json('id');

        // Update item
        $response = $this->putJson("/api/inventory/{$itemId}", [
            'name' => 'Polish Wax Gold',
            'icon' => 'ti-shield',
            'stock' => 15,
            'reorder' => 5,
            'supplier' => 'Suppliers Inc.',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('inventory_items', ['name' => 'Polish Wax Gold']);

        // Delete item
        $response = $this->deleteJson("/api/inventory/{$itemId}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('inventory_items', ['id' => $itemId]);
    }

    public function test_jobcards_crud(): void
    {
        $response = $this->postJson('/api/jobcards', [
            'vehicle' => 'Toyota Fortuner',
            'service' => 'Foam wash',
            'staff' => 'John',
            'bay' => 'Bay 1',
            'note' => 'Pre-existing dent',
        ]);

        $response->assertStatus(201);
        $cardId = $response->json('id');

        $response = $this->putJson("/api/jobcards/{$cardId}", [
            'stage' => 'inprogress',
            'photos' => 2,
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('job_cards', ['id' => $cardId, 'stage' => 'inprogress']);
    }

    public function test_completed_jobcard_creates_billing_invoice(): void
    {
        $booking = Booking::create([
            'branch_id' => 1,
            'minutes' => 630,
            'time_label' => '10:30 AM',
            'customer' => 'Ravi Kumar',
            'phone' => '+91 98765 12345',
            'vehicle' => 'KL-05-AB-1234',
            'service' => 'Basic wash',
            'source' => 'walk-in',
            'status' => 'waiting',
        ]);

        $jobCardResponse = $this->postJson('/api/jobcards', [
            'booking_id' => $booking->id,
            'customer' => $booking->customer,
            'phone' => $booking->phone,
            'vehicle' => $booking->vehicle,
            'service' => $booking->service,
            'staff' => 'John Worker',
            'bay' => 'Bay 1',
        ]);

        $jobCardResponse->assertStatus(201);
        $cardId = $jobCardResponse->json('id');

        $response = $this->putJson('/api/jobcards/'.$cardId, [
            'stage' => 'completed',
            'photos' => 3,
            'signed_off_by' => 'Customer',
            'signed_off_time' => '04:30 PM',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('stage', 'completed')
            ->assertJsonPath('billing_invoice.job_card_id', $cardId)
            ->assertJsonPath('billing_invoice.customer', 'Ravi Kumar')
            ->assertJsonPath('billing_invoice.phone', '+91 98765 12345');

        $invoice = Invoice::where('job_card_id', $cardId)->first();
        $this->assertNotNull($invoice);
        $this->assertSame('Ravi Kumar', $invoice->customer);
        $this->assertSame('+91 98765 12345', $invoice->phone);
        $this->assertSame('Basic wash', $invoice->service);
        $this->assertSame(299, (int) $invoice->subtotal);
        $this->assertSame(0, (int) $invoice->tax_amount);
        $this->assertSame(299, (int) $invoice->amount);
        $this->assertSame('pending', $invoice->status);
        $this->assertSame('pending', $invoice->payment_status);
        $this->assertSame($cardId, $invoice->job_card_id);
    }

    public function test_invoices_crud(): void
    {
        $response = $this->postJson('/api/invoices', [
            'customer' => 'Jane Smith',
            'phone' => '12345',
            'service' => 'Interior clean',
            'amount' => 399,
            'method' => 'pending',
            'status' => 'pending',
        ]);

        $response->assertStatus(201);
        $invoiceId = $response->json('id');
        $this->assertDatabaseHas('invoices', ['customer' => 'Jane Smith', 'status' => 'pending']);

        // Test updating the status to paid
        $updateResponse = $this->putJson('/api/invoices/'.$invoiceId, [
            'status' => 'paid',
            'method' => 'upi',
        ]);

        $updateResponse->assertStatus(200);
        $this->assertDatabaseHas('invoices', [
            'id' => $invoiceId,
            'status' => 'paid',
            'method' => 'upi',
        ]);
    }

    public function test_get_reports_data(): void
    {
        $response = $this->getJson('/api/reports/data');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'kpis' => [
                    'revenue',
                    'expenses',
                    'profit',
                    'repeatPercentage',
                ],
                'peakHours',
                'staffPerformance',
                'monthLabel',
            ]);
    }

    public function test_delete_customer(): void
    {
        $response = $this->postJson('/api/customers', [
            'name' => 'John Doe',
            'phone' => '11111',
            'plan' => 'none',
        ]);
        $response->assertStatus(201);
        $customerId = $response->json('id');
        $this->assertDatabaseHas('customers', ['id' => $customerId]);

        $deleteResponse = $this->deleteJson('/api/customers/'.$customerId);
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('customers', ['id' => $customerId]);
    }

    public function test_delete_invoice(): void
    {
        $response = $this->postJson('/api/invoices', [
            'customer' => 'Jane Smith',
            'phone' => '12345',
            'service' => 'Interior clean',
            'amount' => 399,
            'method' => 'pending',
            'status' => 'pending',
        ]);
        $response->assertStatus(201);
        $invoiceId = $response->json('id');
        $this->assertDatabaseHas('invoices', ['id' => $invoiceId]);

        $deleteResponse = $this->deleteJson('/api/invoices/'.$invoiceId);
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('invoices', ['id' => $invoiceId]);
    }

    public function test_delete_vehicle(): void
    {
        $response = $this->postJson('/api/customers', [
            'name' => 'John Doe',
            'phone' => '11111',
            'plan' => 'none',
            'vehicles' => [
                ['brand' => 'Swift', 'plate' => 'KL-01-AA-1111'],
            ],
        ]);
        $response->assertStatus(201);
        $vehicle = Vehicle::where('plate', 'KL-01-AA-1111')->first();
        $this->assertNotNull($vehicle);

        $deleteResponse = $this->deleteJson('/api/vehicles/'.$vehicle->id);
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('vehicles', ['id' => $vehicle->id]);
    }

    public function test_completed_jobcard_creates_billing_invoice_with_multiple_services(): void
    {
        Service::create(['user_id' => 1, 'name' => 'Interior vacuum', 'price' => 150, 'duration' => 15, 'icon' => 'ti-wind', 'gst_rate' => 18]);

        $booking = Booking::create([
            'branch_id' => 1,
            'minutes' => 630,
            'time_label' => '10:30 AM',
            'customer' => 'Ravi Kumar',
            'phone' => '+91 98765 12345',
            'vehicle' => 'KL-05-AB-1234',
            'service' => 'Basic wash, Interior vacuum',
            'source' => 'walk-in',
            'status' => 'waiting',
        ]);

        $jobCardResponse = $this->postJson('/api/jobcards', [
            'booking_id' => $booking->id,
            'customer' => $booking->customer,
            'phone' => $booking->phone,
            'vehicle' => $booking->vehicle,
            'service' => $booking->service,
            'staff' => 'John Worker',
            'bay' => 'Bay 1',
        ]);

        $jobCardResponse->assertStatus(201);
        $cardId = $jobCardResponse->json('id');

        $response = $this->putJson('/api/jobcards/'.$cardId, [
            'stage' => 'completed',
            'photos' => 0,
        ]);

        $response->assertStatus(200);

        $invoice = Invoice::where('job_card_id', $cardId)->first();
        $this->assertNotNull($invoice);
        $this->assertSame(449, (int) $invoice->subtotal);
        $this->assertSame(0, (int) $invoice->tax_amount);
        $this->assertSame(449, (int) $invoice->amount);
    }

    public function test_upload_jobcard_photo(): void
    {
        Storage::fake('public');

        $card = JobCard::create([
            'id' => 'JC-9999',
            'user_id' => 1,
            'vehicle' => 'Porsche 911',
            'service' => 'Foam Wash',
            'staff' => 'John',
            'bay' => 'Bay 1',
            'stage' => 'assigned',
            'checklist' => [],
            'photos' => 0,
        ]);

        $file = UploadedFile::fake()->image('test_car.jpg');

        $response = $this->postJson('/api/jobcards/'.$card->id.'/photos', [
            'photo' => $file,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('photos', 1);

        $this->assertFileExists(public_path('uploads/jobcards/jc_JC-9999_1.jpg'));

        @unlink(public_path('uploads/jobcards/jc_JC-9999_1.jpg'));
    }

    public function test_services_crud(): void
    {
        $response = $this->postJson('/api/services', [
            'name' => 'Custom Polish',
            'desc' => 'Hand polishing with wax sealant',
            'price' => 1200,
            'duration' => 60,
            'icon' => 'ti-sparkles',
            'category' => 'Premium',
        ]);

        $response->assertStatus(201);
        $serviceId = $response->json('id');
        $this->assertDatabaseHas('services', ['id' => $serviceId, 'name' => 'Custom Polish']);

        $updateResponse = $this->putJson('/api/services/'.$serviceId, [
            'name' => 'Custom Polish Ultra',
            'desc' => 'Premium hand polishing',
            'price' => 1500,
            'duration' => 90,
            'icon' => 'ti-sparkles',
            'category' => 'Premium',
        ]);

        $updateResponse->assertStatus(200);
        $this->assertDatabaseHas('services', ['id' => $serviceId, 'name' => 'Custom Polish Ultra', 'price' => 1500]);

        $deleteResponse = $this->deleteJson('/api/services/'.$serviceId);
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('services', ['id' => $serviceId]);
    }

    public function test_update_vehicle(): void
    {
        $vehicle = Vehicle::create([
            'user_id' => 1,
            'plate' => 'KL-07-BB-9999',
            'brand' => 'Swift',
            'colour' => 'Red',
            'type' => 'sedan',
            'fuel' => 'Petrol',
        ]);

        $response = $this->putJson('/api/vehicles/'.$vehicle->id, [
            'brand' => 'Swift VXI',
            'colour' => 'Blue',
            'type' => 'hatchback',
            'fuel' => 'Diesel',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('vehicles', [
            'id' => $vehicle->id,
            'brand' => 'Swift VXI',
            'colour' => 'Blue',
            'type' => 'hatchback',
            'fuel' => 'Diesel',
        ]);
    }

    public function test_expenses_crud(): void
    {
        $response = $this->postJson('/api/expenses', [
            'category' => 'rent',
            'name' => 'July Rent',
            'amount' => 12000,
            'expense_date' => '2026-07-01',
            'notes' => 'Transaction ID TXN-99923',
        ]);

        $response->assertStatus(201);
        $expenseId = $response->json('id');

        $this->assertDatabaseHas('expenses', [
            'id' => $expenseId,
            'category' => 'rent',
            'name' => 'July Rent',
            'amount' => 12000,
        ]);

        // Get expenses
        $getRes = $this->getJson('/api/expenses');
        $getRes->assertStatus(200)->assertJsonFragment(['name' => 'July Rent']);

        // Delete expense
        $delRes = $this->deleteJson('/api/expenses/'.$expenseId);
        $delRes->assertStatus(200);
        $this->assertDatabaseMissing('expenses', ['id' => $expenseId]);
    }

    public function test_inventory_creation_creates_expense_automatically(): void
    {
        $response = $this->postJson('/api/inventory', [
            'name' => 'Wash Mitts',
            'icon' => 'ti-brush',
            'stock' => 10,
            'reorder' => 2,
            'supplier' => 'Suppliers Inc',
            'unit_cost' => 150,
        ]);

        $response->assertStatus(201);
        $itemId = $response->json('id');

        $this->assertDatabaseHas('inventory_items', [
            'id' => $itemId,
            'unit_cost' => 150,
        ]);

        // Total cost = 10 * 150 = 1500
        $this->assertDatabaseHas('expenses', [
            'category' => 'inventory',
            'name' => 'Purchase: Wash Mitts',
            'amount' => 1500,
            'ref_id' => $itemId,
        ]);
    }

    public function test_manager_account_creation_and_rbac_restrictions(): void
    {
        $admin = User::first();

        // 1. Admin creates manager account
        $mgrResponse = $this->actingAs($admin)->postJson('/api/managers', [
            'name' => 'Kottayam Branch Manager',
            'email' => 'kottayam.mgr@shinewise.com',
            'password' => 'manager123',
        ]);

        $mgrResponse->assertStatus(201);
        $managerId = $mgrResponse->json('id');
        $manager = User::find($managerId);

        $this->assertEquals('manager', $manager->role);
        $this->assertEquals($admin->id, $manager->owner_id);

        // 2. Manager accesses bookings (sees admin's business data)
        $managerBookings = $this->actingAs($manager)->getJson('/api/bookings');
        $managerBookings->assertStatus(200);

        // 3. Manager tries restricted branch creation (forbidden 403)
        $restrictedBranch = $this->actingAs($manager)->postJson('/api/branches', [
            'name' => 'Restricted Branch',
            'location' => 'Kochi',
        ]);
        $restrictedBranch->assertStatus(403);

        // 4. Manager tries restricted staff creation (forbidden 403)
        $restrictedStaff = $this->actingAs($manager)->postJson('/api/staff', [
            'name' => 'Restricted Staff',
            'phone' => '9999999999',
            'branch' => 'Main',
            'shift' => 'Morning',
            'attendance' => 'present',
        ]);
        $restrictedStaff->assertStatus(403);
    }
}
