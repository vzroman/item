import {View as ItemView} from "../item.js";
import {types} from "../../types/index.js";
import {controls} from "../controls/index.js";
import style from "./window.css";
// svg icons
import close from "../../img/close.svg";
import minimize from "../../img/minimize.svg";
import maximize from "../../img/maximize.svg";
import restore from "../../img/restore.svg";

export class View extends ItemView {
    static options = {
        options:{type: types.primitives.Set },
        content:{type:types.complex.Item, options:{schema:{
            view:{type: types.primitives.Class, options:{class:ItemView}, required:true },
            options:{type: types.primitives.Set }
        }}, required:true}
    };

    static events = {
        maximize: true,
        resize: true,
        dragstart: true,
        dragend: true,
        drag: true,
    };

    markup() {
        const width = this._options.options?.width || "100px";
        const height = this._options.options?.height || "100px";

        const maxWidth = this._options.options?.maxWidth || "auto";
        const maxHeight = this._options.options?.maxHeight || "auto";

        const $markup = $(`<div class="${style.window}" style="width: ${width}; height: ${height}; max-height: ${maxHeight}; max-width: ${maxWidth}">
            <div name="titlebar" class="${style.window_titlebar}">
                <div class="${style.window_titlebar__title_wrapper}">
                    <div name="title-icon" style="display: none; width: 20px; height: 20px; background-size: contain; background-repeat: no-repeat;"></div>
                    <span class="${style.window_titlebar__title}">${this._options.options?.title || "Title"}</span>
                </div>
                <div name="actions" class="${style.window_titlebar__actions}">
                    <div name="restore"></div>
                    <div name="minimize"></div>
                    <div name="maximize"></div>
                    <div name="close"></div>
                </div>
            </div>
            <div name="window_content" class="${style.window_content}"></div>
            <div name="resizer n" aria-hidden="true" class="${style.resize_handle} ${style.resize_n}"></div>
            <div name="resizer e" aria-hidden="true" class="${style.resize_handle} ${style.resize_e}"></div>
            <div name="resizer s" aria-hidden="true" class="${style.resize_handle} ${style.resize_s}"></div>
            <div name="resizer w" aria-hidden="true" class="${style.resize_handle} ${style.resize_w}"></div>
            <div name="resizer se" aria-hidden="true" class="${style.resize_handle} ${style.resize_se}"></div>
            <div name="resizer sw" aria-hidden="true" class="${style.resize_handle} ${style.resize_sw}"></div>
            <div name="resizer ne" aria-hidden="true" class="${style.resize_handle} ${style.resize_ne}"></div>
            <div name="resizer nw" aria-hidden="true" class="${style.resize_handle} ${style.resize_nw}"></div>
        </div>`);

        this.$markup = $markup;
        this.$content = $markup.find('[name="window-content"]');
        this.$titlebar = $markup.find('[name="titlebar"]');
        this.$resizers = $markup.find('[name^="resizer"]');

        return $markup;
    }

    constructor(options){
        super(options);

        this.$markup.css({
            top: Math.max(0, (($(window).height() - $(this.$markup).outerHeight()) / 2) + $(window).scrollTop()) + "px",
            left: Math.max(0, (($(window).width() - $(this.$markup).outerWidth()) / 2) + $(window).scrollLeft()) + "px",
        });

        if (this._options.options.modal) {
            const overlayStyle = `
                width:100%; 
                height: 100%;
                postion: fixed; 
                top: 0; 
                left: 0; 
                z-index: 10003; 
                display: inline-flex; 
                opacity: 0.5; 
                background-color: #000000`;
            $(`<div name="window-overlay" style="${overlayStyle}"></div>`).prependTo(this.$markup.parent());
        }
    
        let css = this._options.options.icon
            ?{
                "background-image":this._options.options.icon,
                "display":"block",
            }
            :{
                "background-image":"",
                "display":"none"
            };
        this.$markup.find('[name="title-icon"]').css( css );
        
        if (this._options.options.resizable) {
            this.onResize((value) => { 
                this._trigger("resize", value);
                this._prevDimension = { ...this._prevDimension, ...value };
            });
        }

        if (this._options.options.draggable) {
            this.dragFn = () => {
                this.onDrag({
                    dragstart: () => { this._trigger("dragstart"); },
                    dragend: () => { this._trigger("dragend"); },
                    drag: (value) => { 
                        this._trigger("drag", value);
    
                        let nextDimension;
    
                        if (this.$titlebar.innerHeight() + "px" === value.height) {
                            nextDimension = {
                                height: this._prevDimension.height, 
                                width: value.width, 
                                top: value.top, 
                                left: value.left
                            };
                        } else {
                            nextDimension = value; 
                        }
    
                        this._prevDimension = nextDimension;
                    },
                });
            };
            this.dragFn();
        }

        this._resizeObserver = new ResizeObserver(() => {
            this.$markup.css({       
                height: $(window).height() + "px", 
                width: $(window).width() + "px"
            });
        });

        this._prevDimension = {
            width: "auto",
            height: "auto",
            top: "auto",
            left: "auto",
        };
        this._isMinimized = false;
    }

    _hideResizers() {
        this.$resizers?.each(function() { $(this).css({display: "none"}); });
    }

    _showResizers() {
        this.$resizers?.each(function() { $(this).css({display: "flex"}); });
    }

    onDrag({ dragstart, dragend, drag }) {
        let $window = $(window);
        let isDragStarted = false;
        let pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;

        this.$titlebar.on("mousedown", dragMouseDown);

        const element = this.$markup;

        function dragMouseDown(e) {
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            // call a function whenever the cursor moves:
            $window.on("mousemove", elementDrag);
            $window.on("mouseup", closeDragElement);
        }

        function elementDrag(e) {
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            const offset = element.offset();
            const top =  offset.top - pos2 + "px";
            const left = offset.left - pos1 + "px";

            element.css({ top, left });

            if (!isDragStarted) { dragstart(); isDragStarted = true; }
            
            drag({
                top,
                left,
                width: element.width() + "px",
                height: element.height() + "px"
            });
        }

        function closeDragElement() {
            /* stop moving when mouse button is released:*/
            $window.off("mousemove", elementDrag);
            $window.off("mouseup", closeDragElement);
            dragend();
            isDragStarted = false;
        }
    }

    onResize(callback) {
        let $window = $(window), element = this.$markup;
        const resizers = element.find('[name^="resizer"]'), minimum_size = 20;
        let original_width = 0;
        let original_height = 0;
        let original_x = 0;
        let original_y = 0;
        let original_mouse_x = 0;
        let original_mouse_y = 0;
        
        for (let i = 0; i < resizers.length; i++) {
            const currentResizer = $(resizers[i]);
            currentResizer.on("mousedown", function(e) {
                e.preventDefault();
                original_width = parseFloat(element.css("width").replace("px", ""));
                original_height = parseFloat(element.css("height").replace("px", ""));
                
                original_x = element[0].getBoundingClientRect().left;
                original_y = element[0].getBoundingClientRect().top;
                original_mouse_x = e.pageX;
                original_mouse_y = e.pageY;
    
                $window.on('mousemove', resize);
                $window.on('mouseup', stopResize);
            });
    
            function resize(e) {
                const resizerName = currentResizer.attr("name");

                if (resizerName.endsWith("se")) {
                    const width = original_width + (e.pageX - original_mouse_x);
                    const height = original_height + (e.pageY - original_mouse_y);
                    if (width > minimum_size) {
                        element.width(width + "px");
                    }
                    if (height > minimum_size) {
                        element.height(height + "px");
                    }
                } else if (resizerName.endsWith("sw")) {
                    const height = original_height + (e.pageY - original_mouse_y);
                    const width = original_width - (e.pageX - original_mouse_x);
                    if (height > minimum_size) {
                        element.height(height + "px");
                    }
                    if (width > minimum_size) {
                        element.width(width + "px");
                        element.css({ "left": original_x + (e.pageX - original_mouse_x) + "px" });
                    }
                } else if (resizerName.endsWith("ne")) {
                    const width = original_width + (e.pageX - original_mouse_x);
                    const height = original_height - (e.pageY - original_mouse_y);
                    if (width > minimum_size) {
                        element.width(width + "px");
                    }
                    if (height > minimum_size) {
                        element.height(height + "px");
                        element.css({ "top": original_y + (e.pageY - original_mouse_y) + "px" });
                    }
                } else if (resizerName.endsWith("nw")) {
                    const width = original_width - (e.pageX - original_mouse_x);
                    const height = original_height - (e.pageY - original_mouse_y);
                    if (width > minimum_size) {
                        element.width(width + "px");
                        element.css({ "left": original_x + (e.pageX - original_mouse_x) + "px" });
                    }
                    if (height > minimum_size) {
                        element.height(height + "px");
                        element.css({ "top": original_y + (e.pageY - original_mouse_y) + "px" });
                    }
                } else {
                    if (resizerName === "resizer s") {
                        const height = original_height + (e.pageY - original_mouse_y);

                        if (height > minimum_size) {
                            element.height(height + "px");
                        }
                    } else if (resizerName === "resizer w" ) {
                        const width = original_width - (e.pageX - original_mouse_x);
                      
                        if (width > minimum_size) {
                            element.width(width + "px");
                            element.css({ "left": original_x + (e.pageX - original_mouse_x) + 'px'});
                        }
                    } else if (resizerName === "resizer n") {
                        const height = original_height - (e.pageY - original_mouse_y);

                        if (height > minimum_size) {
                            element.height(height + "px");
                            element.css({ "top": original_y + (e.pageY - original_mouse_y) + "px" });
                        }
                    } else {
                        const width = original_width + (e.pageX - original_mouse_x)

                        if (width > minimum_size) {
                            element.width(width + "px");
                        }
                    }
                }

                if (typeof callback === "function") {
                    callback({
                        width: element.width() + "px",
                        height: element.height() + "px",
                    });
                }
            }
    
            function stopResize() {
                $window.off('mousemove', resize);
                $window.off('mouseup', stopResize);
            }
        }
    }

    maximize() {
        const {top, left} = this.$markup.position();
        const width = this.$markup.width();
        const height = this.$markup.height();
    
        this.$markup.css({ 
            top: "0px", 
            left: "0px", 
            height: $(window).height() + "px", 
            width: $(window).width() + "px"
        });

        $('body').css({overflow: "hidden"});

        this._resizeObserver.observe(document.body);

        this._prevDimension = {
            top: top + "px", 
            left: left + "px", 
            height: height + "px", 
            width: width + "px"
        };
    }

    minimize() {
        this.$markup.css({ 
            height: this.$titlebar.innerHeight() + "px", 
            overflow: "hidden" 
        });
    }

    restore() {
        $('body').css({overflow: "unset"});
        this.$markup.css({...this._prevDimension, overflow: "scroll"});
    }

    actions() {
        const _this = this;

        return {
            minimize:{
                view: controls.Button,
                options:{ 
                    events:{
                        click:{handler:() => {
                            _this.minimize();
                            this._isMinimized = true;
                            _this._hideResizers();
                            return true;
                        }, target:"widgets.restore@visible" }
                    },
                    classes: [style.item_grid_button],
                    icon: `url("${ minimize }")`,
                    links: { visible: { source: "widgets.restore@visible", handler: val => !val } },
                }
            },
            maximize:{
                view: controls.Button,
                options:{ 
                    events:{
                        click:{handler: () => {
                            _this.maximize();
                            _this.$titlebar.off("mousedown");
                            _this._hideResizers();
                            this._isMinimized = false;
                            return true;
                        },target:"widgets.restore@visible" }
                    },
                    classes: [style.item_grid_button],
                    icon: `url("${ maximize }")`,
                    links: { visible: { source: "widgets.restore@visible", handler: val => !val } },
                }
            },
            restore:{
                view: controls.Button,
                options:{ 
                    visible:false,
                    events:{
                        click:(_,restore) => {
                            this._resizeObserver.disconnect();
                            restore.set({ visible: false });
                            _this.restore();
                            if (!this._isMinimized) {
                                _this.dragFn();
                            }
                            _this._showResizers();
                        }
                    },
                    links: { visible: { source: "widgets.minimize@visible", handler: val => {
                        return !val;
                    } } },
                    classes: [style.item_grid_button],
                    icon: `url("${ restore }")`
                }
            },
            close:{
                view: controls.Button,
                options:{ 
                    events:{
                        click:() => {
                            _this.$markup.animate({
                                opacity: 0, 
                                height: 0
                            }, { duration: 300, queue: false, complete: () => {
                                _this.destroy(); 
                            } });
                            _this.$markup.parent().find("[name='window-overlay']").fadeOut({ queue: false, duration: 300, complete: function() {
                                $(this).remove();
                            } });
                            this._resizeObserver?.disconnect();
                        },
                    },
                    classes: [style.item_grid_button],
                    icon: `url("${ close }")`
                }
            },
        };
    }

    widgets() {
        const actions = this.actions();

        return {
            window_content: this._options.content,
            ...[...this._options.options.actions, "restore"].reduce((acc, name) => {
                if (!actions[name]) {return acc;}
                acc[name] = actions[name];
                return acc;
            }, {})
        };
    }
}

View.extend();