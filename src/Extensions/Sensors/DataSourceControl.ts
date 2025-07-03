// import { getSensorData } from './sensorUtils';
// import eventBus from '../../modules/Events';
//
// /**
//  * UI control for switching between data sources
//  */
// export class DataSourceControl {
//     private container: HTMLElement;
//     private currentSource: 'mock' | 'mqtt' | 'dual' = 'mock';
//
//     /**
//      * Create a new DataSourceControl
//      * @param container The HTML element to append the control to
//      */
//     constructor(container: HTMLElement) {
//         this.container = container;
//         this.currentSource = getSensorData().getDataSource();
//         this.render();
//
//         // Listen for data source changes from other components
//         eventBus.on('dataSourceChanged', (source) => {
//             this.currentSource = source;
//             this.updateUI();
//         });
//     }
//
//     /**
//      * Render the control
//      */
//     private render(): void {
//         // Create container
//         const controlContainer = document.createElement('div');
//         controlContainer.className = 'data-source-control';
//         controlContainer.style.padding = '10px';
//         controlContainer.style.backgroundColor = '#f5f5f5';
//         controlContainer.style.borderRadius = '5px';
//         controlContainer.style.margin = '10px 0';
//
//         // Add title
//         const title = document.createElement('h3');
//         title.textContent = 'Data Source';
//         title.style.margin = '0 0 10px 0';
//         controlContainer.appendChild(title);
//
//         // Add radio buttons
//         const sources = [
//             { id: 'mock', label: 'Mock Data' },
//             { id: 'mqtt', label: 'MQTT (Real-time)' },
//             { id: 'dual', label: 'Dual Mode' }
//         ];
//
//         const radioGroup = document.createElement('div');
//         radioGroup.style.display = 'flex';
//         radioGroup.style.flexDirection = 'column';
//
//         sources.forEach(source => {
//             const label = document.createElement('label');
//             label.style.display = 'flex';
//             label.style.alignItems = 'center';
//             label.style.marginBottom = '5px';
//             label.style.cursor = 'pointer';
//
//             const radio = document.createElement('input');
//             radio.type = 'radio';
//             radio.name = 'data-source';
//             radio.value = source.id;
//             radio.checked = this.currentSource === source.id;
//             radio.style.marginRight = '8px';
//
//             radio.addEventListener('change', () => {
//                 if (radio.checked) {
//                     this.setDataSource(source.id as 'mock' | 'mqtt' | 'dual');
//                 }
//             });
//
//             const text = document.createTextNode(source.label);
//
//             label.appendChild(radio);
//             label.appendChild(text);
//             radioGroup.appendChild(label);
//         });
//
//         controlContainer.appendChild(radioGroup);
//
//         // Add status indicator
//         const statusContainer = document.createElement('div');
//         statusContainer.style.marginTop = '10px';
//         statusContainer.style.display = 'flex';
//         statusContainer.style.alignItems = 'center';
//
//         const statusIndicator = document.createElement('div');
//         statusIndicator.className = 'status-indicator';
//         statusIndicator.style.width = '10px';
//         statusIndicator.style.height = '10px';
//         statusIndicator.style.borderRadius = '50%';
//         statusIndicator.style.marginRight = '8px';
//
//         const statusText = document.createElement('span');
//         statusText.className = 'status-text';
//
//         statusContainer.appendChild(statusIndicator);
//         statusContainer.appendChild(statusText);
//         controlContainer.appendChild(statusContainer);
//
//         // Add to main container
//         this.container.appendChild(controlContainer);
//
//         // Set initial status
//         this.updateStatus();
//
//         // Listen for MQTT connection status changes
//         eventBus.on('mqttConnected', (connected) => {
//             this.updateStatus();
//         });
//
//         eventBus.on('mqttError', (error) => {
//             this.updateStatus(error);
//         });
//     }
//
//     /**
//      * Update the UI to reflect the current data source
//      */
//     private updateUI(): void {
//         const radios = this.container.querySelectorAll<HTMLInputElement>('input[name="data-source"]');
//         radios.forEach(radio => {
//             radio.checked = radio.value === this.currentSource;
//         });
//
//         this.updateStatus();
//     }
//
//     /**
//      * Update the status indicator
//      * @param error Optional error message
//      */
//     private updateStatus(error?: string): void {
//         const statusIndicator = this.container.querySelector('.status-indicator') as HTMLElement;
//         const statusText = this.container.querySelector('.status-text') as HTMLElement;
//
//         if (!statusIndicator || !statusText) return;
//
//         if (error) {
//             statusIndicator.style.backgroundColor = 'red';
//             statusText.textContent = `Error: ${error}`;
//             return;
//         }
//
//         if (this.currentSource === 'mock') {
//             statusIndicator.style.backgroundColor = 'green';
//             statusText.textContent = 'Mock data active';
//         } else if (this.currentSource === 'mqtt') {
//             const mqttStatus = getSensorData().getDataSource() === 'mqtt';
//             statusIndicator.style.backgroundColor = mqttStatus ? 'green' : 'orange';
//             statusText.textContent = mqttStatus ? 'MQTT connected' : 'Connecting to MQTT...';
//         } else {
//             statusIndicator.style.backgroundColor = 'blue';
//             statusText.textContent = 'Dual mode active';
//         }
//     }
//
//     /**
//      * Set the data source
//      * @param source The data source to set
//      */
//     private setDataSource(source: 'mock' | 'mqtt' | 'dual'): void {
//         this.currentSource = source;
//         getSensorData().setDataSource(source);
//         this.updateStatus();
//     }
// }
//
// /**
//  * Create and attach a DataSourceControl to the specified container
//  * @param container The container element
//  * @returns The created DataSourceControl
//  */
// export function createDataSourceControl(container: HTMLElement): DataSourceControl {
//     return new DataSourceControl(container);
// }