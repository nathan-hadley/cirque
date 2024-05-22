import tkinter as tk
from tkinter import filedialog, scrolledtext
from PIL import Image, ImageTk

class ImageApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Image Click Coordinates Recorder")

        # Initialize coordinates list
        self.coordinates = []

        # Setup the UI
        self.setup_ui()

    def setup_ui(self):
        # Frame for buttons
        frame = tk.Frame(self.root)
        frame.pack(fill=tk.BOTH, expand=True)

        # Button to open image
        btn_open = tk.Button(frame, text="Open Image", command=self.open_image)
        btn_open.pack(side=tk.LEFT)

        # Button to finish and print coordinates
        btn_done = tk.Button(frame, text="Done", command=self.print_coordinates)
        btn_done.pack(side=tk.RIGHT)

        # Label to display the image
        self.lbl_image = tk.Label(self.root)
        self.lbl_image.pack(fill=tk.BOTH, expand=True)

        # Text area for displaying coordinates and image name
        self.text_area = scrolledtext.ScrolledText(self.root, wrap=tk.WORD, height=10)
        self.text_area.pack(fill=tk.BOTH, expand=True)
        self.text_area.configure(font='TkFixedFont')  # Ensures better readability for coordinates

    def open_image(self):
        # Open a file dialog to select an image
        file_path = filedialog.askopenfilename()
        if file_path:
            self.image_name = file_path.split('/')[-1]
            self.image = Image.open(file_path)
            self.photo = ImageTk.PhotoImage(self.image)
            self.lbl_image.config(image=self.photo)
            self.lbl_image.bind('<Button-1>', self.record_click)
            self.image_loaded = True
            # Clear previous coordinates in the text area
            self.text_area.delete('1.0', tk.END)

    def record_click(self, event):
        # Record the click coordinates
        self.coordinates.append([event.x, event.y])

    def print_coordinates(self):
        # Ensure an image is loaded and coordinates have been recorded
        if self.image_loaded and self.coordinates:
            self.text_area.delete('1.0', tk.END)
            self.text_area.insert(tk.END, f"image: {self.image_name}\n")
            self.text_area.insert(tk.END, f'"line": "{self.coordinates}"\n')
            # Clear coordinates after outputting
            self.coordinates = []
        else:
            self.text_area.delete('1.0', tk.END)
            self.text_area.insert(tk.END, "No image loaded or no coordinates recorded.\n")


if __name__ == "__main__":
    root = tk.Tk()
    app = ImageApp(root)
    root.mainloop()
