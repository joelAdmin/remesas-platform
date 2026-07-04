<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CloudinaryStorageService
{
    protected ?Cloudinary $cloudinary = null;

    public function store(UploadedFile $file, string $folder = 'receipts'): array
    {
        $disk = config('filesystems.default');

        if ($disk === 'cloudinary') {
            return $this->storeOnCloudinary($file, $folder);
        }

        return $this->storeLocally($file, $folder);
    }

    protected function storeOnCloudinary(UploadedFile $file, string $folder): array
    {
        $cloudinary = $this->getCloudinary();
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $uploaded = $cloudinary->uploadApi()->upload($file->getRealPath(), [
            'public_id' => $folder . '/' . $filename,
            'folder' => $folder,
        ]);

        return [
            'path' => $uploaded['secure_url'],
            'url' => $uploaded['secure_url'],
            'disk' => 'cloudinary',
        ];
    }

    protected function storeLocally(UploadedFile $file, string $folder): array
    {
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs($folder, $filename, 'public');

        return [
            'path' => $path,
            'url' => '/storage/' . $path,
            'disk' => 'public',
        ];
    }

    protected function getCloudinary(): Cloudinary
    {
        if ($this->cloudinary === null) {
            $this->cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => config('cloudinary.cloud_name'),
                    'api_key' => config('cloudinary.api_key'),
                    'api_secret' => config('cloudinary.api_secret'),
                ],
                'url' => [
                    'secure' => true,
                ],
            ]);
        }

        return $this->cloudinary;
    }
}
