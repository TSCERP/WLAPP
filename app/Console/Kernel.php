<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule)
    {
        // $schedule->command('sql:run-first')->dailyAt('15:30');
        // $schedule->command('sql:run-second')->dailyAt('16:15');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }

    protected $commands = [
        \App\Console\Commands\RefreshRolesPermissions::class,
        \App\Console\Commands\UpdateUserRole::class,
        \App\Console\Commands\UpdateUserFactory::class,
        \App\Console\Commands\UpdatePermissionTemp::class,
    ];

}
