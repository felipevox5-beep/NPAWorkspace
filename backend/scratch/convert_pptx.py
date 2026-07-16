import os
import sys
import time

def convert_pptx_to_pdf(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")

    # Import win32com inside try block to handle potential import errors gracefully
    try:
        import win32com.client
    except ImportError:
        print("Error: pywin32 library is not installed. Please run 'pip install pywin32' first.")
        sys.exit(1)

    # Initialize PowerPoint Application
    try:
        powerpoint = win32com.client.Dispatch("PowerPoint.Application")
    except Exception as e:
        print(f"Error starting PowerPoint COM automation: {e}")
        print("Please make sure Microsoft PowerPoint is installed on your system.")
        sys.exit(1)

    files = [f for f in os.listdir(input_dir) if f.lower().endswith(".pptx")]
    print(f"Found {len(files)} PPTX files to convert.")

    success_count = 0
    for file in files:
        input_path = os.path.abspath(os.path.join(input_dir, file))
        output_name = os.path.splitext(file)[0] + ".pdf"
        output_path = os.path.abspath(os.path.join(output_dir, output_name))

        print(f"Converting {file} to PDF...")
        try:
            # Open presentation
            # Format: Open(FileName, ReadOnly, Untitled, WithWindow)
            # WithWindow=False runs it in background without opening a window
            # Using 1 (True) for ReadOnly, 0 (False) for Untitled, and 0 (False) for WithWindow
            pres = powerpoint.Presentations.Open(input_path, 1, 0, 0)
            
            # Save as PDF (FileFormat 32 is ppSaveAsPDF)
            # SaveAs(FileName, FileFormat)
            pres.SaveAs(output_path, 32)
            pres.Close()
            print(f"Successfully converted {file} -> {output_name}")
            success_count += 1
        except Exception as e:
            print(f"Error converting {file}: {e}")

    # Quit PowerPoint
    try:
        powerpoint.Quit()
    except Exception as e:
        print(f"Error quitting PowerPoint application: {e}")

    print(f"Conversion completed. {success_count}/{len(files)} files converted successfully.")
    return success_count == len(files)

if __name__ == "__main__":
    input_directory = r"C:\Users\FBernardo\Desktop\Critério cosmético Cielo - Visual"
    output_directory = r"C:\Users\FBernardo\Desktop\App BookNpa Cielo\frontend\public\visual"
    convert_pptx_to_pdf(input_directory, output_directory)
