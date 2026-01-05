#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
src_out.py - 将./src目录结构及.ts文件内容输出到./out.txt
"""

import os
import sys
from pathlib import Path

def clear_or_create_output_file():
    """清空或创建输出文件"""
    output_file = Path("./out.txt")
    
    try:
        # 如果文件存在则清空，不存在则创建
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("")  # 清空文件内容
        print(f"✓ 已{'清空' if output_file.exists() else '创建'}输出文件: {output_file.absolute()}")
        return True
    except Exception as e:
        print(f"✗ 处理输出文件时出错: {e}")
        return False

def write_directory_structure():
    """写入./src的目录结构"""
    src_dir = Path("./src")
    
    if not src_dir.exists():
        print(f"✗ 目录不存在: {src_dir.absolute()}")
        return False
    
    print(f"正在写入目录结构: {src_dir.absolute()}")
    
    try:
        with open("./out.txt", 'a', encoding='utf-8') as out_file:
            # 写入标题
            out_file.write("=" * 60 + "\n")
            out_file.write(f"目录结构: {src_dir.absolute()}\n")
            out_file.write("=" * 60 + "\n\n")
            
            # 递归遍历目录结构
            for root, dirs, files in os.walk(src_dir):
                # 计算缩进级别
                level = root.replace(str(src_dir), '').count(os.sep)
                indent = ' ' * 2 * level
                
                # 写入当前目录
                dir_name = os.path.basename(root) if root != str(src_dir) else "."
                out_file.write(f"{indent}{dir_name}/\n")
                
                # 写入文件
                sub_indent = ' ' * 2 * (level + 1)
                for file in sorted(files):
                    out_file.write(f"{sub_indent}{file}\n")
            
            out_file.write("\n" + "=" * 60 + "\n\n")
        
        print("✓ 目录结构已写入")
        return True
    except Exception as e:
        print(f"✗ 写入目录结构时出错: {e}")
        return False

def process_ts_files(target):
    """处理所有.ts文件（跳过main.ts）"""
    src_dir = Path("./src")
    
    print("正在处理.ts文件...")
    ts_files_processed = 0
    
    try:
        with open("./out.txt", 'a', encoding='utf-8') as out_file:
            # 递归查找所有.ts文件
            for ts_file in src_dir.rglob(target):
                # 跳过main.ts
                # if ts_file.name.lower() == "main.ts":
                #     print(f"跳过: {ts_file.relative_to(src_dir)}")
                #     continue
                
                try:
                    # 读取文件内容
                    with open(ts_file, 'r', encoding='utf-8') as ts_content:
                        content = ts_content.read()
                    
                    # 写入分隔符和文件信息
                    # out_file.write(f"\n{'=' * 60}\n")
                    # out_file.write(f"文件: {ts_file.relative_to(src_dir)}\n")
                    # out_file.write(f"路径: {ts_file.absolute()}\n")
                    # out_file.write(f"{'=' * 60}\n\n")
                    
                    # 写入文件内容
                    out_file.write(content)
                    out_file.write("\n")  # 添加空行分隔
                    
                    ts_files_processed += 1
                    print(f"✓ 已处理: {ts_file.relative_to(src_dir)}")
                    
                except UnicodeDecodeError:
                    print(f"✗ 编码错误: {ts_file.relative_to(src_dir)}")
                except Exception as e:
                    print(f"✗ 读取文件时出错 {ts_file.relative_to(src_dir)}: {e}")
        
        print(f"\n✓ 已完成处理 {ts_files_processed} 个.ts文件")
        return True
    except Exception as e:
        print(f"✗ 处理.ts文件时出错: {e}")
        return False

def check_src_directory():
    """检查./src目录是否存在且包含.ts文件"""
    src_dir = Path("./src")
    
    if not src_dir.exists():
        print(f"✗ 错误: ./src 目录不存在")
        print("请确保当前目录下存在./src目录")
        return False
    
    # 检查是否有.ts文件（不包括main.ts）
    has_ts_files = any(f.suffix.lower() == '.ts' 
                       for f in src_dir.rglob("*.ts") 
                    #    if f.name.lower() != 'main.ts'
                       )
    
    if not has_ts_files:
        print("⚠ 警告: ./src 目录中没有找到.ts文件（或只有main.ts）")
    
    return True

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "ts"
    target = f"*.{target.lstrip('*.')}"
    
    """主函数"""
    print("=" * 60)
    print("src_out.py - 导出目录结构和.ts文件内容")
    print("=" * 60)
    
    # 检查./src目录
    if not check_src_directory():
        sys.exit(1)
    
    # 步骤1: 清空或创建输出文件
    if not clear_or_create_output_file():
        sys.exit(1)
    
    # 步骤2: 写入目录结构
    if not write_directory_structure():
        print("警告: 目录结构写入失败，继续处理...")
    
    # 步骤3: 处理.ts文件
    if not process_ts_files(target):
        print("警告: .ts文件处理过程中出现错误")
    
    # 显示结果
    output_file = Path("./out.local")
    if output_file.exists():
        file_size = output_file.stat().st_size
        print(f"\n{'=' * 60}")
        print(f"任务完成!")
        print(f"输出文件: {output_file.absolute()}")
        print(f"文件大小: {file_size} 字节 ({file_size/1024:.2f} KB)")
        print(f"{'=' * 60}")
        
        # 显示文件前几行
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                print(f"\n文件前5行预览:")
                for i, line in enumerate(lines[:5]):
                    print(f"  {i+1}: {line.rstrip()}")
                if len(lines) > 5:
                    print("  ...")
        except:
            pass

if __name__ == "__main__":
    main()