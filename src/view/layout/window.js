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

        width:{type: types.primitives.Float},
        height:{type: types.primitives.Float},

        maxWidth:{type: types.primitives.Float},
        maxHeight:{type: types.primitives.Float},

        minWidth:{type: types.primitives.Float},
        minHeight:{type: types.primitives.Float},

        title:{type: types.primitives.String, default:""},
        icon:{type: types.primitives.String},
        actions:{type: types.primitives.Array, default:["maximize","minimize","close"]},

        modal:{type: types.primitives.Bool},
        draggable:{type: types.primitives.Bool},
        resizable:{type: types.primitives.Bool},

        position:{type:types.complex.Item, options:{schema:{
            top:{type: types.primitives.Float, required:true },
            left:{type: types.primitives.Float, required:true }
        }}},
        content:{type:types.complex.Item, options:{schema:{
            view:{type: types.primitives.Class, options:{class:ItemView}, required:true },
            options:{type: types.primitives.Set }
        }}, required:true},

        isFocused:{type: types.primitives.Bool, default:true},
        isMinimized:{type: types.primitives.Bool, default:false},
        isMaximized:{type: types.primitives.Bool, default:false}
    };

    static events = {
        maximize: true,
        resize: true,
        dragstart: true,
        dragend: true,
        drag: true,
    };

    static markup = `<div class="${style.window}">
            <div class="${style.titlebar}">
                <div class="${ style.title_icon }"></div>
                <div class="${ style.title_text }"></div>
                <div class="${ style.title_actions }">
                    <div name="restore"></div>
                    <div name="minimize"></div>
                    <div name="maximize"></div>
                    <div name="close"></div>
                </div>
            </div>
            <div name="content" class="${style.content}"></div>
            <div class="${style.resize_handle} ${style.resize_n}"></div>
            <div class="${style.resize_handle} ${style.resize_e}"></div>
            <div class="${style.resize_handle} ${style.resize_s}"></div>
            <div class="${style.resize_handle} ${style.resize_w}"></div>
            <div class="${style.resize_handle} ${style.resize_se}"></div>
            <div class="${style.resize_handle} ${style.resize_sw}"></div>
            <div class="${style.resize_handle} ${style.resize_ne}"></div>
            <div class="${style.resize_handle} ${style.resize_nw}"></div>
        </div>`;

    // markup() {
    //     // const width = this._options.options?.width || "100px";
    //     // const height = this._options.options?.height || "100px";
    //     //
    //     // const maxWidth = this._options.options?.maxWidth || "auto";
    //     // const maxHeight = this._options.options?.maxHeight || "auto";
    //
    //     return $(`<div class="${style.window}">
    //         <div class="${style.titlebar}">
    //             <div class="${ style.title_icon }"></div>
    //             <div class="${ style.title_text }"></div>
    //             <div class="${ style.title_actions }">
    //                 <div name="restore"></div>
    //                 <div name="minimize"></div>
    //                 <div name="maximize"></div>
    //                 <div name="close"></div>
    //             </div>
    //         </div>
    //         <div name="content" class="${style.content}"></div>
    //         <div class="${style.resize_handle} ${style.resize_n}"></div>
    //         <div class="${style.resize_handle} ${style.resize_e}"></div>
    //         <div class="${style.resize_handle} ${style.resize_s}"></div>
    //         <div class="${style.resize_handle} ${style.resize_w}"></div>
    //         <div class="${style.resize_handle} ${style.resize_se}"></div>
    //         <div class="${style.resize_handle} ${style.resize_sw}"></div>
    //         <div class="${style.resize_handle} ${style.resize_ne}"></div>
    //         <div class="${style.resize_handle} ${style.resize_nw}"></div>
    //     </div>`);
    //
    //     // this.$content = $markup.find(`.${ style.content }`);
    //     //
    //     // this.$titlebar = $markup.find('[name="titlebar"]');
    //     // this.$resizers = $markup.find('[name^="resizer"]');
    //     //
    //     // return $markup;
    // }

    constructor(options){
        options.$container = options.$container || $('body');
        super(options);

        if (!this._options.position){
            this.set({position:{
                top: Math.max(0, (($(window).height() - $(this.$markup).outerHeight()) / 2) + $(window).scrollTop()),
                left: Math.max(0, (($(window).width() - $(this.$markup).outerWidth()) / 2) + $(window).scrollLeft())
            }});
        }

        //---------position------------------------------
        this.bind("position",position=> {

            if (!position) return;
            if (this._options.isMinimized || this._options.isMaximized) return;

            this.$markup.css({
                top: position.top + "px",
                left: position.left + "px"
            });
        });

        // this.$markup.css({
        //     top: Math.max(0, (($(window).height() - $(this.$markup).outerHeight()) / 2) + $(window).scrollTop()) + "px",
        //     left: Math.max(0, (($(window).width() - $(this.$markup).outerWidth()) / 2) + $(window).scrollLeft()) + "px",
        // });
        //
        // if (this._options.options.modal) {
        //     const overlayStyle = `
        //         width:100%;
        //         height: 100%;
        //         postion: fixed;
        //         top: 0;
        //         left: 0;
        //         z-index: 10003;
        //         display: inline-flex;
        //         opacity: 0.5;
        //         background-color: #000000`;
        //     $(`<div name="window-overlay" style="${overlayStyle}"></div>`).prependTo(this.$markup.parent());
        // }
        //
        // let css = this._options.options.icon
        //     ?{
        //         "background-image":this._options.options.icon,
        //         "display":"block",
        //     }
        //     :{
        //         "background-image":"",
        //         "display":"none"
        //     };
        // this.$markup.find('[name="title-icon"]').css( css );
        //
        // if (this._options.options.resizable) {
        //     this.onResize((value) => {
        //         this._trigger("resize", value);
        //         this._prevDimension = { ...this._prevDimension, ...value };
        //     });
        // }
        //
        // if (this._options.options.draggable) {
        //     this.dragFn = () => {
        //         this.onDrag({
        //             dragstart: () => { this._trigger("dragstart"); },
        //             dragend: () => { this._trigger("dragend"); },
        //             drag: (value) => {
        //                 this._trigger("drag", value);
        //
        //                 let nextDimension;
        //
        //                 if (this.$titlebar.innerHeight() + "px" === value.height) {
        //                     nextDimension = {
        //                         height: this._prevDimension.height,
        //                         width: value.width,
        //                         top: value.top,
        //                         left: value.left
        //                     };
        //                 } else {
        //                     nextDimension = value;
        //                 }
        //
        //                 this._prevDimension = nextDimension;
        //             },
        //         });
        //     };
        //     this.dragFn();
        // }
        //
        // this._resizeObserver = new ResizeObserver(() => {
        //     this.$markup.css({
        //         height: $(window).height() + "px",
        //         width: $(window).width() + "px"
        //     });
        // });
        //
        // this._prevDimension = {
        //     width: "auto",
        //     height: "auto",
        //     top: "auto",
        //     left: "auto",
        // };
        // this._isMinimized = false;
    }

    widgets() {
        return {
            minimize:{
                view: controls.Button,
                options:{
                    events:{
                        click:()=> this.set({isMinimized: true})
                    },
                    // classes: [style.item_grid_button],
                    icon: `url("${ minimize }")`,
                    links: { visible: { source: "parent", event:["actions","isMaximized","isMinimized"], handler: ({actions,isMaximized,isMinimized}) => {
                        if (!actions.includes("minimize")) return false;
                        return ! (isMinimized || isMaximized)
                    } } },
                }
            },
            maximize:{
                view: controls.Button,
                options:{
                    events:{
                        click:()=> this.set({isMaximized: true})
                    },
                    // classes: [style.item_grid_button],
                    icon: `url("${ maximize }")`,
                    links: { visible: { source: "parent", event:["actions","isMaximized","isMinimized"], handler: ({actions,isMaximized,isMinimized}) => {
                        if (!actions.includes("maximize")) return false;
                        return ! (isMinimized || isMaximized)
                    } } }
                }
            },
            restore:{
                view: controls.Button,
                options:{
                    visible:false,
                    events:{
                        click:() => this.set({isMaximized: false, isMinimized: false})
                    },
                    icon: `url("${ restore }")`,
                    links: { visible: { source: "parent", event:["isMaximized","isMinimized"], handler: ({isMaximized,isMinimized}) => {
                        return (isMinimized || isMaximized)
                    } } },
                    //classes: [style.item_grid_button],
                }
            },
            close:{
                view: controls.Button,
                options:{
                    events:{
                        click:() => this.destroy()
                    },
                    // classes: [style.item_grid_button],
                    icon: `url("${ close }")`
                }
            },
            content: this._options.content,
        };
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

}

View.extend();