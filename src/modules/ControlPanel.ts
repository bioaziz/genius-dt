// src/modules/ControlPanel.ts
export default class ControlPanel {
  private readonly panel: HTMLDivElement;

constructor() {
  this.panel = document.createElement('div');
  this.panel.id = 'left-panel';
  this.panel.className = 'fixed top-0 left-0 w-52 h-full bg-gray-800 text-white shadow-md p-4';

  const title = document.createElement('h3');
  title.textContent = 'Control Panel';
  title.className = 'text-lg font-bold mb-4';
  this.panel.appendChild(title);

  console.log('Appending Control Panel to body...');
  document.body.appendChild(this.panel);
  console.log('Control Panel appended:', this.panel);
}

  public addButton(label: string, onClick: () => void): void {
    const button = document.createElement('button');
    button.textContent = label;
    button.className =
      'w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 mb-4 rounded focus:outline-none';
    button.addEventListener('click', onClick);
    this.panel.appendChild(button);
  }
}
