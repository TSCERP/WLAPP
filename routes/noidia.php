<?php

use App\Http\Controllers\sap\NoiDiaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::group(['prefix' => 'noidia'], function () {
        Route::post('/ghinhan-sanluong', [NoiDiaController::class, 'GhiNhanSanluong']);
        Route::get('/lenh-san-xuat', [NoiDiaController::class, 'DanhSachLenh']);
        Route::get('/lenh-san-xuat/{id}', [NoiDiaController::class, 'ChiTietLenh']);
        Route::get('/danh-sach-masd', [NoiDiaController::class, 'DanhSachMaSoDo']);
        Route::post('/update-status-masd', [NoiDiaController::class, 'CapNhatTrangThai']);
        Route::get('/du-an', [NoiDiaController::class, 'DanhSachDuAn']);
        Route::get('/can-ho', [NoiDiaController::class, 'DanhSachCan']);
        Route::get('/tien-do-lap-dat', [NoiDiaController::class, 'DanhSachTienDo']);
        Route::post('/tien-do-lap-dat', [NoiDiaController::class, 'CapNhatTienDo']);
    });

});
