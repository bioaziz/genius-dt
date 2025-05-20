import UIBasePanel from "../UI/Panel/UIBasePanel";

export default class MoverPositionPanel extends UIBasePanel {
    public onPositionSet?: (targetPosition: number) => void;

    private floors: { label: string; position: number }[] = [
        {label: "1", position: 0},
        {label: "2", position: 4},
        {label: "3", position: 8},
        {label: "4", position: 12},
        {label: "5", position: 16},
        {label: "6", position: 20},
    ];

    constructor() {
        super("mover-position-panel", "Elevator Control", 200, 300);

        this.content.classList.add("bg-black", "text-white", "p-2", "rounded-l");
        this.container.classList.add("fixed", "top-[650px]", "left-[1600px]", "w-[200px]");
        this.container.style.top = "650px";
        this.container.style.left = "1600px";
        this.container.style.width = "200px";
        this.createUI();
    }

    private createUI() {
        const label = document.createElement("label");
        label.innerText = "Select Floor:";
        label.classList.add("text-white", "text-lg", "font-bold", "mb-1");
        this.content.appendChild(label);

        // ✅ Create Floor Buttons
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("grid", "grid-cols-2", "gap-3", "mt-3");

        this.floors.forEach((floor) => {
            const button = document.createElement("button");
            button.innerText = floor.label;
            button.classList.add(
                "bg-orange-500", "text-white", "py-2", "px-4", "rounded-lg",
                "hover:bg-orange-600", "transition", "duration-300", "text-2xl",
                "shadow-md"
            );

            button.addEventListener("click", () => {
                if (this.onPositionSet) {
                    this.onPositionSet(floor.position);
                }
            });

            buttonContainer.appendChild(button);
        });

        this.content.appendChild(buttonContainer);
    }
}
