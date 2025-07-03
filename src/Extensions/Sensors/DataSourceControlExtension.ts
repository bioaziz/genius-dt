import { Extension } from "../Extension";
import { GeniusWorld } from "../../modules/GeniusWorld";
import { createDataSourceControl } from "./DataSourceControl";

/**
 * Extension that adds a data source control panel to the UI
 */
export class DataSourceControlExtension implements Extension {
    private world: GeniusWorld;
    private container: HTMLElement | null = null;
    
    /**
     * Create a new DataSourceControlExtension
     * @param world The GeniusWorld instance
     */
    constructor(world: GeniusWorld) {
        this.world = world;
    }
    
    /**
     * Initialize the extension
     */
    init(): void {
        // Create container for the control
        this.container = document.createElement('div');
        this.container.className = 'data-source-control-container';
        this.container.style.position = 'absolute';
        this.container.style.top = '10px';
        this.container.style.right = '10px';
        this.container.style.zIndex = '1000';
        this.container.style.width = '200px';
        
        // Add to document
        document.body.appendChild(this.container);
        
        // Create the control
        createDataSourceControl(this.container);
        
        console.log('✅ DataSourceControlExtension initialized');
    }
    
    /**
     * Dispose of the extension
     */
    dispose(): void {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }
}