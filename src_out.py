import os
import sys

def get_all_files(directory):
    """获取目录下所有文件的路径"""
    all_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            all_files.append(file_path)
    return all_files

def read_file_content(file_path):
    """读取文件内容"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        try:
            with open(file_path, 'r', encoding='gbk') as f:
                return f.read()
        except:
            return f"无法读取文件（编码问题）: {file_path}"
    except Exception as e:
        return f"读取文件失败: {str(e)}"

def generate_prompt_file(src_dir, output_file):
    """生成提示词文件"""
    # 检查src目录是否存在
    if not os.path.exists(src_dir):
        print(f"错误: 目录 '{src_dir}' 不存在")
        return False
    
    # 获取所有文件
    all_files = get_all_files(src_dir)
    
    if not all_files:
        print(f"警告: 目录 '{src_dir}' 中没有文件")
        return False
    
    print(f"找到 {len(all_files)} 个文件")
    
    # 写入输出文件
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            processed_count = 0
            for i, file_path in enumerate(all_files):
                # 获取相对路径（相对于src目录）
                relative_path = os.path.relpath(file_path, src_dir)
                full_relative_path = os.path.join("src", relative_path)
                
                # 读取文件内容
                content = read_file_content(file_path)
                
                # 写入到输出文件
                f.write("\n")
                f.write(f"{full_relative_path}\n")
                f.write("```js\n")
                f.write(content)
                if content and not content.endswith('\n'):
                    f.write("\n")
                f.write("```\n\n")
                
                processed_count += 1
                # 打印进度
                if (i + 1) % 10 == 0 or (i + 1) == len(all_files):
                    print(f"已处理 {i + 1}/{len(all_files)} 个文件")
        
        print(f"\n完成！提示词已保存到: {output_file}")
        print(f"共处理 {processed_count} 个文件")
        return True
        
    except Exception as e:
        print(f"写入文件失败: {str(e)}")
        return False

def main():
    # 获取当前脚本所在目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 定义src目录和输出文件路径
    src_dir = os.path.join(current_dir, "src")
    output_file = os.path.join(current_dir, "src提示词.txt")
    
    print("=" * 50)
    print("代码提取工具")
    print("=" * 50)
    print(f"源码目录: {src_dir}")
    print(f"输出文件: {output_file}")
    print("=" * 50)
    
    # 生成提示词文件
    success = generate_prompt_file(src_dir, output_file)
    
    if success:
        # 显示输出文件的一些信息
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                content = f.read()
                print(f"输出文件大小: {len(content)} 字符")
        except:
            pass
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())