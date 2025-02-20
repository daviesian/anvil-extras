

export class DesignerComponent {
    static css = "";
    static links: string[] = [];
    static script = "";
    static loaded = false;
    static loading = false;
    static defaults: { [keys: string]: any} = {};
    static initializing: boolean = false;
    static postLoad(): void {}

    domNode: HTMLElement;
    pyComponent: any;
    el: HTMLElement;

    constructor(domNode: HTMLElement, pyComponent: any, el: HTMLElement) {
        this.domNode = domNode;
        this.pyComponent = pyComponent;
        this.el = el;
    }

    static init(selector: string, className: string = "anvil-extras-designer") {
        const doInit = () => {
            this.loading = true;
            $(() => {
                this.setup(selector, className);
                this.postLoad();
                this.loaded = true;
                this.loading = false;
            });
        };

        if (!this.loaded && !this.loading) {
            // set this now to prevent other instance trying to do the same thing
            this.loading = true;
            this.links.forEach((href) => {
                const l = document.createElement("link");
                l.href = href;
                l.rel = "stylesheet";
                document.body.appendChild(l);
            });
            if (this.css) {
                // load the css after the link
                const s = document.createElement("style");
                s.innerHTML = this.css;
                document.body.appendChild(s);
            }
            if (this.script) {
                const s = document.createElement("script");
                s.src = this.script;
                document.body.appendChild(s);
                s.onload = doInit;
            } else {
                doInit();
            }
        } else if (!this.loading) {
            doInit();
        }
    }

    static setup(selector: string, className: string) {
        for (let el of document.querySelectorAll<HTMLElement>(selector)) {
            const container = el.parentElement;
            if (container.classList.contains(className)) {
                return;
            }
            container.classList.add(className);

            const pyComponent = $(container).data("anvilPyComponent");
            let props;
            try {
                props = pyComponent._anvil.customPropVals;
            } catch (e) {
                  console.error(e);
                return;
            }
            const self = new this(container, pyComponent, el);
            if (props) {
                self.makeGetSets(props);
            }
            self.update({ ...(props || this.defaults) });
        }
    }

    makeGetSets(props: { [keys: string]: any}): void {
        const copyProps = { ...props };
        const self = this;
        for (let propName in copyProps) {
            this.setProp(propName, props[propName], copyProps);
            Object.defineProperty(props, propName, {
                get() {
                    return copyProps[propName];
                },
                set(v) {
                    copyProps[propName] = v;
                    try {
                        self.setProp(propName, v, copyProps);
                        self.update({ ...copyProps }, propName, v);
                    } catch {}
                    return true;
                },
            });
        }
    }

    update(props: object, propName?: string, val?: any): void {}

    setProp(propName: string, val: any, props: any): void {}

    updateSpacing({ spacing_above , spacing_below }: { spacing_above: string, spacing_below: string, [keys: string]: any}): void {
        const stale_spacing = Array.prototype.filter.call(this.domNode.classList, (x: string) =>
            x.startsWith("anvil-spacing-")
        );
        this.domNode.classList.remove(...stale_spacing);
        spacing_above && this.domNode.classList.add(("anvil-spacing-above-" + spacing_above) as string);
        spacing_below && this.domNode.classList.add(("anvil-spacing-above-" + spacing_below) as string);
    }

    updateRole({ role }: { role: string, [keys: string]: any}) {
        const stale_role = Array.prototype.filter.call(this.domNode.classList, (x) => x.startsWith("anvil-role-"));
        this.domNode.classList.remove(...stale_role);
        role && this.domNode.classList.add("anvil-role-" + role);
    }

    updateVisible({ visible }: { visible: boolean, [keys: string]: any}) {
        this.domNode.classList.toggle("visible-false", !visible);
    }

    getColor(color?: string, _default?: string | boolean): string | undefined {
        if (color && color.startsWith("theme:")) {
            //@ts-ignore
            color = window.anvilThemeColors[color.replace("theme:", "")] || "";
        }
        if (!color && _default) {
            if (_default === true || _default === "primary") {
                //@ts-ignore
                return window.anvilThemeColors["Primary 500"] || "#2196F3";
            }
            return _default;
        }
        return color;
    }

    getColorRGB(color?: string, _default?: string | boolean) {
        color = this.getColor(color, _default);
        if (color && color.startsWith("#")) {
            const bigint = parseInt(color.slice(1), 16);
            return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255].join(",");
        } else if (color && color.startsWith("rgb(")) {
            return color.slice(4, color.length - 1);
        }
        return color;
    }

    clearElement(el: HTMLElement) {
        while (el.firstElementChild) {
            el.removeChild(el.firstElementChild);
        }
    }
    get [Symbol.toStringTag]() {
        return "Designer Component";
    }
}
