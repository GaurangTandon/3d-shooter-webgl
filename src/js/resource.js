import * as THREE from "../build/three.module.js";

class ResourceTracker {
    constructor() {
        this.resources = new Set();
    }

    track(resource, uuid) {
        if (!resource) {
            return resource;
        }

        if (!uuid) {
            uuid = resource.uuid;
        }

        // handle children and when material is an array of materials or
        // uniform is array of textures
        if (Array.isArray(resource)) {
            resource.forEach((resource) => this.track(resource));
            return resource;
        }

        if (resource.dispose || resource instanceof THREE.Object3D) {
            this.resources.add([uuid, resource]);
        }
        if (resource instanceof THREE.Object3D) {
            this.track(resource.geometry, uuid);
            this.track(resource.material, uuid);
            this.track(resource.children, uuid);
        } else if (resource instanceof THREE.Material) {
            // We have to check if there are any textures on the material
            for (const value of Object.values(resource)) {
                if (value instanceof THREE.Texture) {
                    this.track(value, uuid);
                }
            }
            // We also have to check if any uniforms reference textures or arrays of textures
            if (resource.uniforms) {
                for (const value of Object.values(resource.uniforms)) {
                    if (value) {
                        const uniformValue = value.value;
                        if (uniformValue instanceof THREE.Texture
                            || Array.isArray(uniformValue)) {
                            this.track(uniformValue, uuid);
                        }
                    }
                }
            }
        }
        return resource;
    }

    untrack(resource) {
        this.resources.delete(resource);
    }

    dispose(uuidSearch) {
        for (const [uuid, resource] of this.resources) {
            if (uuidSearch && uuid !== uuidSearch) {
                continue;
            }

            if (resource instanceof THREE.Object3D) {
                if (resource.parent) {
                    resource.parent.remove(resource);
                }
            }
            if (resource.dispose) {
                resource.dispose();
            }
        }
        this.resources.clear();
    }
}

export { ResourceTracker };
