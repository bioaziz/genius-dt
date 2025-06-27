export default class UIBasePanel {
    protected container: HTMLDivElement;
    protected titleBar: HTMLDivElement;
    protected content: HTMLDivElement;
    protected table: HTMLTableElement | null = null;
    protected selectedRow: HTMLTableRowElement | null = null; // Track selected row
    private isMinimized: boolean = false;

    constructor(id: string, title: string, width: number = 600, height: number = 300) {
        // Panel Container
        this.container = document.createElement("div");
        this.container.id = id;
        this.container.className = "ui-panel";
        Object.assign(this.container.style, {
            position: "absolute",
            width: `${width}px`,
            height: `${height}px`,
            top: "45px",
            left: "1220px",
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "white",
            border: "1px solid #ccc",
            resize: "both",
            padding: "0",
            zIndex: "1000",
            borderRadius: "8px",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
            display: "flex",
            flexDirection: "column",
            transition: "height 0.2s ease-in-out",
            overflow: "auto",
        });

        // Title Bar
        this.titleBar = document.createElement("div");
        this.titleBar.innerText = title;
        Object.assign(this.titleBar.style, {
            backgroundColor: "#222",
            padding: "8px 10px",
            cursor: "move",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderRadius: "6px 6px 0 0",
            fontWeight: "bold"
        });

        // Minimize Button
        const minimizeButton = document.createElement("span");
        minimizeButton.innerText = "—";
        minimizeButton.style.cursor = "pointer";
        minimizeButton.style.marginRight = "10px";
        minimizeButton.style.fontSize = "16px";
        minimizeButton.addEventListener("click", () => this.toggleMinimize());

        // Close Button
        const closeButton = document.createElement("span");
        closeButton.innerText = "✖";
        closeButton.style.cursor = "pointer";
        closeButton.style.fontSize = "16px";
        closeButton.addEventListener("click", () => this.dispose());

        const buttonContainer = document.createElement("div");
        buttonContainer.appendChild(minimizeButton);
        buttonContainer.appendChild(closeButton);
        this.titleBar.appendChild(buttonContainer);
        this.container.appendChild(this.titleBar);

        // Content Area (scrollable)
        this.content = document.createElement("div");
        Object.assign(this.content.style, {
            flex: "1",           // Fill remaining space below the title
            overflow: "hidden",    // Make the content scrollable
            padding: "10px",
            minHeight: "0"         // Fix for flex child not shrinking
        });
        this.container.appendChild(this.content);

        document.body.appendChild(this.container);
        this.initializeDrag();
    }

    // Table Setup: Allows child classes to define columns & data
    protected initializeTable(columns: { title: string; field: string }[]) {
        console.log("✅ Initializing Table inside UIBasePanel...");

        if (this.table) {
            console.warn("⚠️ Table already initialized. Skipping recreation.");
            return;
        }

        this.table = document.createElement("table");
        this.table.classList.add("ui-table");
        this.table.style.width = "100%";
        this.table.style.borderCollapse = "collapse";
        this.table.style.cursor = "pointer";

        // Create Table Header
        let headerRow = "<tr style='background: #222; color: white; text-align: left;'>";
        columns.forEach(col => {
            headerRow += `<th style='border: 1px solid #ccc; padding: 8px;'>${col.title}</th>`;
        });
        headerRow += "</tr>";

        this.table.innerHTML = `<thead>${headerRow}</thead><tbody></tbody>`;

        // Append Table to Content
        this.content.appendChild(this.table);
    }

    // Populates Table with Data
    protected populateTable(data: any[]) {
        if (!this.table) return;

        console.log("🔄 Populating Table in UIBasePanel...");
        const tbody = this.table.querySelector("tbody")!;
        tbody.innerHTML = ""; // Clear previous rows

        data.forEach((rowData) => {
            const row = document.createElement("tr");
            row.dataset.sensorId = rowData.id; // Store sensor ID
            row.style.borderBottom = "1px solid #ddd";
            row.style.transition = "background 0.2s ease-in-out";

            row.innerHTML = Object.values(rowData)
                .map(value => `<td style='border: 1px solid #ccc; padding: 8px;'>${value}</td>`)
                .join("");

            // Hover Effect (Only if not selected)
            row.addEventListener("mouseenter", () => {
                if (this.selectedRow !== row) {
                    row.style.backgroundColor = "rgba(96,96,96,0.71)"; // Temporary hover effect
                }
            });

            row.addEventListener("mouseleave", () => {
                if (this.selectedRow !== row) {
                    row.style.backgroundColor = ""; // Only reset if NOT selected
                }
            });

            // Row Click Event (Can be overridden by subclasses)
            row.addEventListener("click", () => this.onRowClicked(row));

            tbody.appendChild(row);
        });

        console.log("✅ Table Populated with", data.length, "rows.");
    }

    // Handles Row Clicks
    protected onRowClicked(row: HTMLTableRowElement) {
        const sensorId = row.dataset.sensorId;
        if (!sensorId) return;

        console.log(`📌 Row Clicked - Sensor ID: ${sensorId}`);

        // Remove highlight from previously selected row
        if (this.selectedRow) {
            this.selectedRow.style.backgroundColor = "";
        }

        // Highlight the selected row
        this.selectedRow = row;
        this.selectedRow.style.backgroundColor = "rgba(196,89,0,0.92)";
    }

    // Toggle Minimize/Maximize
    private toggleMinimize(): void {
        if (this.isMinimized) {
            this.content.style.display = "block";
            this.container.style.height = "300px";
        } else {
            this.content.style.display = "none";
            this.container.style.height = "40px";
        }
        this.isMinimized = !this.isMinimized;
    }

    // Set panel visibility
    setVisible(visible: boolean): void {
        this.container.style.display = visible ? "block" : "none";
    }

    // Properly Dispose the Panel
    public dispose(): void {
        console.log(`🗑️ Disposing panel: ${this.container.id}`);
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }

    // Dragging Functionality
    private initializeDrag(): void {
        let offsetX = 0, offsetY = 0, isDragging = false;

        this.titleBar.addEventListener("mousedown", (event) => {
            isDragging = true;
            offsetX = event.clientX - this.container.offsetLeft;
            offsetY = event.clientY - this.container.offsetTop;
            event.preventDefault(); // Prevents unwanted text selection
        });

        document.addEventListener("mousemove", (event) => {
            if (isDragging) {
                this.container.style.left = `${event.clientX - offsetX}px`;
                this.container.style.top = `${event.clientY - offsetY}px`;
            }
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
        });
    }
}
