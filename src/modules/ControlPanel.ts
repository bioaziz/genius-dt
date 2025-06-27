export default class ControlPanel {
    private readonly panel: HTMLDivElement;
    private buttonStates: Map<string, boolean> = new Map(); // ✅ Store active states
    private tooltip: HTMLDivElement;
    // private sensorHeatmap: SensorHeatmapExtension; // ✅ Store heatmap instance

    constructor() {
        const panelElement = document.getElementById("control-panel");

        if (!panelElement) {
            throw new Error("❌ Control panel container (#control-panel) not found!");
        }

        this.panel = panelElement as HTMLDivElement;
        // this.sensorHeatmap = sensorHeatmap;
        this.panel.className = "bg-gray-900 text-white shadow-lg rounded p-4 flex gap-4 relative";

        // ✅ Create Tooltip Box (Hidden Initially)
        this.tooltip = document.createElement("div");
        this.tooltip.className =
            "absolute bg-black text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-200 pointer-events-none";
        this.tooltip.style.position = "absolute";
        this.tooltip.style.top = "100%"; // ✅ Position below the button
        this.tooltip.style.left = "50%";
        this.tooltip.style.transform = "translateX(-50%) translateY(10px)";
        this.tooltip.style.whiteSpace = "nowrap";
        this.tooltip.style.visibility = "hidden";

        this.panel.appendChild(this.tooltip); // Attach tooltip to panel

        console.log("✅ Control Panel Initialized:", this.panel);
    }

    // ✅ Add Button with Toggle State
    public addButton(iconSrc: string, label: string, onClick: (isActive: boolean) => void): void {
        const button = document.createElement("button");
        button.className = "text-white p-2 rounded focus:outline-none hover:bg-purple-600 relative";

        // ✅ Create Image Element for Icon
        const icon = document.createElement("img");
        icon.src = iconSrc;
        icon.className = "w-4 h-4"; // Adjust icon size
        button.appendChild(icon);

        // ✅ Initialize state as inactive
        this.buttonStates.set(label, false);

        // ✅ Click Event to Toggle Active State
        button.addEventListener("click", () => {
            const isActive = !this.buttonStates.get(label); // Toggle state
            this.buttonStates.set(label, isActive);

            // ✅ Apply Active Color (Purple) When Active
            button.classList.toggle("bg-purple-600", isActive);

            // ✅ Call the Click Handler with Active State
            onClick(isActive);
        });

        // ✅ Tooltip Hover Logic (Positioned Below)
        button.addEventListener("mouseenter", () => {
            this.tooltip.textContent = label;
            this.tooltip.style.opacity = "1";
            this.tooltip.style.visibility = "visible";
            this.tooltip.style.top = `${button.offsetTop + button.offsetHeight + 5}px`;
            this.tooltip.style.left = `${button.offsetLeft + button.offsetWidth / 2}px`;
        });

        button.addEventListener("mouseleave", () => {
            this.tooltip.style.opacity = "0";
            this.tooltip.style.visibility = "hidden";
        });

        this.panel.appendChild(button);
    }

}
