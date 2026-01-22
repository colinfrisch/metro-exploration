import matplotlib.pyplot as plt
import numpy as np

# Exact colors from the first 10 metro lines in lines.json
colors = [
    "#FFCD00", # Ligne 1
    "#007852", # Ligne 10
    "#837902", # Ligne 3
    "#6EC4E8", # Ligne 3bis
    "#CF009E", # Ligne 4
    "#FF7E2E", # Ligne 5
    "#6ECA97", # Ligne 6
    "#FA9ABA", # Ligne 7
    "#E19BDF", # Ligne 8
    "#B6BD00"  # Ligne 9
]

# Labels for the lines
labels = ["L1", "L2", "L3", "L3b", "L4", "L5", "L6", "L7", "L8", "L9"]

# Create data for the pie chart (equal slices)
data = [1] * 10

fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(aspect="equal"))

# Create the pie chart (roulette style, full up to the center)
ax.pie(data, colors=colors, startangle=90, 
       counterclock=False, wedgeprops=dict(edgecolor='w', linewidth=1))

plt.title("Paris Metro Roulette", fontsize=16, pad=20)

# Save the image
plt.savefig("logo_metro_roulette.png", bbox_inches='tight', dpi=300)
print("Image saved as logo_metro_roulette.png")
