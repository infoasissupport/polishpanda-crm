<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Handle user registration.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'branches' => 'nullable|array',
            'branches.*' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name' => trim($request->first_name.' '.$request->last_name),
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $branches = $request->branches;
        if (empty($branches)) {
            $branches = ['Main branch'];
        }

        foreach ($branches as $index => $branchName) {
            $codeNum = $index + 1;
            $cleanName = preg_replace('/[^A-Za-z0-9]/', '', $branchName);
            $prefix = strtoupper(substr($cleanName, 0, 4));
            if (empty($prefix)) {
                $prefix = 'BRCH';
            }
            $branchCode = $prefix.'-0'.$codeNum;

            Branch::create([
                'user_id' => $user->id,
                'name' => trim($branchName),
                'code' => $branchCode,
                'location' => 'Kerala',
                'city' => trim($branchName),
                'state' => 'Kerala',
                'phone' => '',
                'gst_number' => '',
            ]);
        }

        Auth::login($user, true);

        return response()->json([
            'status' => 'success',
            'message' => 'Registration successful.',
            'user' => $user,
        ], 201);
    }

    /**
     * Handle user login.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        if (Auth::attempt($request->only('email', 'password'), $request->boolean('remember', false))) {
            $user = Auth::user();
            
            if ($user->role === 'manager' && $request->input('source') !== 'app') {
                Auth::logout();
                return response()->json([
                    'status' => 'error',
                    'message' => 'Manager accounts must log in via the mobile app.',
                ], 403);
            }

            $request->session()->regenerate();
            $user->load('assignedBranch');

            return response()->json([
                'status' => 'success',
                'message' => 'Logged in successfully.',
                'user' => $user,
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'The provided credentials do not match our records.',
        ], 401);
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get authenticated user.
     */
    public function user(Request $request)
    {
        if (Auth::check()) {
            return response()->json([
                'status' => 'success',
                'user' => Auth::user(),
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Unauthenticated.',
        ], 401);
    }
}
