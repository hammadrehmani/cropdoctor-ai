import os

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except (UnicodeDecodeError, IsADirectoryError):
        return False
    
    new_content = content.replace('CropDoctor Ai', 'CropDoctor Ai')
    new_content = new_content.replace('CropDoctor', 'CropDoctor')
    new_content = new_content.replace('cropdoctor', 'cropdoctor')
    new_content = new_content.replace('CROPDOCTOR', 'CROPDOCTOR')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    root_dir = r"d:\cropdoctor-ai"
    count = 0
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # skip .git and node_modules, etc
        if '.git' in dirpath or 'node_modules' in dirpath or '.next' in dirpath or '__pycache__' in dirpath or 'venv' in dirpath:
            continue
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            if replace_in_file(filepath):
                print(f"Updated {filepath}")
                count += 1
    print(f"Total files updated: {count}")

if __name__ == '__main__':
    main()
