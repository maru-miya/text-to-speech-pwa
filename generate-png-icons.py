#!/usr/bin/env python3
"""
シンプルな青背景に白いマイクのPWAアイコンを生成するスクリプト
PIL (Pillow) を使用してPNG画像を直接作成
"""

from PIL import Image, ImageDraw
import os

def create_simple_mic_icon(size):
    """青背景に白いマイクのシンプルなアイコンを作成"""
    # 新しい画像を作成（青背景）
    img = Image.new('RGB', (size, size), '#3B82F6')
    draw = ImageDraw.Draw(img)

    # スケール計算（192pxを基準）
    scale = size / 192

    # マイク本体のサイズ
    mic_width = int(40 * scale)
    mic_height = int(80 * scale)
    mic_x = (size - mic_width) // 2
    mic_y = (size - mic_height - int(30 * scale)) // 2
    corner_radius = int(20 * scale)

    # マイク本体（角丸長方形）
    draw.rounded_rectangle(
        [mic_x, mic_y, mic_x + mic_width, mic_y + mic_height],
        radius=corner_radius,
        fill='#FFFFFF'
    )

    # マイクハンドル（細い線）
    handle_width = int(4 * scale)
    handle_height = int(25 * scale)
    handle_x = (size - handle_width) // 2
    handle_y = mic_y + mic_height

    draw.rectangle(
        [handle_x, handle_y, handle_x + handle_width, handle_y + handle_height],
        fill='#FFFFFF'
    )

    # マイク台座（角丸）
    base_width = int(20 * scale)
    base_height = int(6 * scale)
    base_x = (size - base_width) // 2
    base_y = handle_y + handle_height
    base_radius = int(3 * scale)

    draw.rounded_rectangle(
        [base_x, base_y, base_x + base_width, base_y + base_height],
        radius=base_radius,
        fill='#FFFFFF'
    )

    return img

def main():
    """メイン関数：各サイズのアイコンを生成"""
    # iconsディレクトリを作成
    icons_dir = 'icons'
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)

    # 生成するアイコンの設定
    icon_configs = [
        (512, 'icon-512.png'),
        (192, 'icon-192.png'),
        (180, 'apple-touch-icon-180.png'),
        (32, 'favicon-32.png'),
        (144, 'icon-144.png'),  # manifest.jsonで使用
    ]

    print("シンプルな青背景に白いマイクのPWAアイコンを生成中...")

    for size, filename in icon_configs:
        print(f"  生成中: {filename} ({size}x{size})")

        # アイコンを作成
        icon = create_simple_mic_icon(size)

        # ファイルパス
        filepath = os.path.join(icons_dir, filename)

        # 保存
        icon.save(filepath, 'PNG', optimize=True)
        print(f"  保存完了: {filepath}")

    print("\n✅ 全てのアイコンの生成が完了しました！")
    print("\n生成されたファイル:")
    for size, filename in icon_configs:
        filepath = os.path.join(icons_dir, filename)
        if os.path.exists(filepath):
            file_size = os.path.getsize(filepath)
            print(f"  - {filepath} ({file_size:,} bytes)")

if __name__ == "__main__":
    main()