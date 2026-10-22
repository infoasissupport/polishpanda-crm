<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class CarwashSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 1;

        // Services — typical Kerala car wash pricing
        $services = [
            ['name' => 'Body wash', 'category' => 'Exterior', 'desc' => 'Exterior body wash with pressure cleaning.', 'price' => 150, 'duration' => 20, 'icon' => 'ti-wash', 'gst_rate' => 5],
            ['name' => 'Foam wash', 'category' => 'Exterior', 'desc' => 'Full foam bath with wax finish.', 'price' => 200, 'duration' => 30, 'icon' => 'ti-droplet', 'gst_rate' => 5],
            ['name' => 'Interior cleaning', 'category' => 'Interior', 'desc' => 'Cabin vacuuming, dashboard polish and seat wipe.', 'price' => 300, 'duration' => 40, 'icon' => 'ti-wind', 'gst_rate' => 18],
            ['name' => 'Full wash + Interior', 'category' => 'Bundle', 'desc' => 'Complete exterior foam wash with interior cleaning.', 'price' => 400, 'duration' => 50, 'icon' => 'ti-sparkles', 'gst_rate' => 18],
            ['name' => 'Engine wash', 'category' => 'Detailing', 'desc' => 'Engine bay degreasing and cleaning.', 'price' => 250, 'duration' => 25, 'icon' => 'ti-engine', 'gst_rate' => 18],
            ['name' => 'AC vent cleaning', 'category' => 'Detailing', 'desc' => 'AC vent and cabin air filter cleaning.', 'price' => 200, 'duration' => 20, 'icon' => 'ti-air-conditioning', 'gst_rate' => 18],
            ['name' => 'Headlight restoration', 'category' => 'Detailing', 'desc' => 'UV-damaged headlight lens polishing.', 'price' => 800, 'duration' => 45, 'icon' => 'ti-bulb', 'gst_rate' => 18],
            ['name' => 'Ceramic coating', 'category' => 'Premium', 'desc' => 'Durable high-gloss ceramic paint protection.', 'price' => 3500, 'duration' => 120, 'icon' => 'ti-shield', 'gst_rate' => 18],
            ['name' => 'Graphene coating', 'category' => 'Premium', 'desc' => 'Premium multi-year graphene protective shield.', 'price' => 5000, 'duration' => 180, 'icon' => 'ti-atom-2', 'gst_rate' => 18],
        ];

        foreach ($services as $s) {
            Service::create(array_merge($s, ['user_id' => $userId]));
        }
    }
}
