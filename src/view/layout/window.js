import {View as ItemView} from "../item.js";
import {types} from "../../types/index.js";
import {controls} from "../controls/index.js";
import style from "./window.css";
// svg icons
import close from "../../img/close.svg";
import minimize from "../../img/minimize.svg";
import maximize from "../../img/maximize.svg";
import restore from "../../img/restore.svg";


export class Window extends ItemView {

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
        draggable:{type: types.primitives.Bool, default:true},
        resizable:{type: types.primitives.Bool, default:true},

        position:{type:types.complex.Item, options:{schema:{
            top:{type: types.primitives.Float, required:true },
            left:{type: types.primitives.Float, required:true }
        }}},
        view:{type:types.complex.Item, options:{schema:{
            view:{type: types.primitives.Class, options:{class:ItemView}, required:true },
            options:{type: types.primitives.Set }
        }}, required:true},

        isFocused:{type: types.primitives.Bool, default:true},
        z_index:{type: types.primitives.Integer, default:11002},
        isMinimized:{type: types.primitives.Bool, default:false},
        isMaximized:{type: types.primitives.Bool, default:false}
    };

    static markup = `<div class="${style.window}" style="z-index: 11002">
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
            <div name="view" class="${style.view}"></div>
            <div class="${style.resize_handle} ${style.resize_n}"></div>
            <div class="${style.resize_handle} ${style.resize_e}"></div>
            <div class="${style.resize_handle} ${style.resize_s}"></div>
            <div class="${style.resize_handle} ${style.resize_w}"></div>
            <div class="${style.resize_handle} ${style.resize_se}"></div>
            <div class="${style.resize_handle} ${style.resize_sw}"></div>
            <div class="${style.resize_handle} ${style.resize_ne}"></div>
            <div class="${style.resize_handle} ${style.resize_nw}"></div>
        </div>`;

    constructor(options){
        options.$container = options.$container || $('body');
        super(options);

        this._onDestroy = [];
        this._resizeObserver = undefined;

        //---------position------------------------------
        if (!this._options.position){
            const setCenter=()=>{
                this.set({position:{
                    top: Math.max(0, (($(window).height() - $(this.$markup).outerHeight()) / 2) + $(window).scrollTop()),
                    left: Math.max(0, (($(window).width() - $(this.$markup).outerWidth()) / 2) + $(window).scrollLeft())
                }});
            }
            setCenter();
            this._resizeObserver = new ResizeObserver(setCenter);
            this._resizeObserver.observe(this.$markup[0]);

        }
        this.bind("position",position=> {

            if (!position) return;
            if ( this._options.isMaximized ) return;

            this.$markup.css({
                top: position.top + "px",
                left: position.left + "px"
            });
        });

        //---------size------------------------------
        const $view = this.$markup.find(`.${ style.view }`);
        this.bind("width", width =>{
            if (typeof width !== "number") return;
            if (typeof this._options.maxWidth === "number" && width > this._options.maxWidth){
                width = this._options.maxWidth;
            }else if(typeof this._options.minWidth === "number" && width < this._options.minWidth){
                width = this._options.minWidth;
            }
            $view.width( width );
        });

        this.bind("height", height =>{
            if (typeof height !== "number") return;
            if (typeof this._options.maxHeight === "number" && height > this._options.maxHeight){
                height = this._options.maxHeight;
            }else if(typeof this._options.minHeight === "number" && height < this._options.minHeight){
                height = this._options.minHeight;
            }
            $view.height( height );
        });

        //---------title------------------------------
        const $title = this.$markup.find(`.${ style.title_text }`);
        this.bind("title",title=> {
            $title.text( title );
        });

        //---------icon------------------------------
        const $icon = this.$markup.find(`.${ style.title_icon }`);
        this.bind("icon",icon=> {
            let css = icon
                ?{
                    "background-image":icon,
                    "display":"block"
                }
                :{
                    "background-image":"",
                    "display":"none"
                };
            $icon.css( css );
        });

        //---------focus------------------------------
        this.$markup.on("click",()=> this.set({isFocused:true}));
        const onDocumentClick = e => this.set({isFocused:this.$markup[0].contains(e.target)});

        document.addEventListener("mousedown", onDocumentClick);
        document.addEventListener("touchstart", onDocumentClick);

        this._onDestroy.push(() => {
            document.removeEventListener("mousedown", onDocumentClick);
            document.removeEventListener("touchstart", onDocumentClick);
        });

        this.bind("isFocused",isFocused=> {
            this.$markup.toggleClass(style.focused, isFocused);
            if (isFocused){
                // Take the maximum z-index among other windows
                let z_index = +this._options.z_index;
                const $windows = $(`.${ style.window }`);
                for (let i=0; i<$windows.length; i++){
                    const z = +$( $windows[i] ).css("z-index");
                    if (z >= z_index && $windows[i] !== this.$markup[0]) z_index = z + 2;
                }
                this.set({z_index});
            }
        });

        //---------z_index------------------------------
        this.bind("z_index",z_index=> {
            this.$markup.css({"z-index":z_index});
        });


        //---------drag----------------------------------
        const $titlebar = this.$markup.find(`.${ style.titlebar }`);
        let dragPoint, position;
        const onDragEnd = () => {
            dragPoint = undefined;
            position = undefined;
            window.removeEventListener("mousemove", onDrag);
            window.removeEventListener("mouseup", onDragEnd);
        }
        const onDrag = e => {
            if (e.buttons !== 1) return onDragEnd();

            const shiftX = e.clientX - dragPoint.x;
            const shiftY = e.clientY - dragPoint.y;

            this.set({position:{
                top: position.y + shiftY,
                left: position.x + shiftX
             }});
        };
        $titlebar.on("mousedown", e =>{

            if ((!this._options.draggable) || this._options.isMaximized) return;

            this._resizeObserver?.disconnect();
            this._resizeObserver=undefined;

            dragPoint = {
                x: e.clientX,
                y: e.clientY
            };
            position = {
                x: this._options.position.left,
                y: this._options.position.top
            };

            window.addEventListener('mousemove', onDrag);
            window.addEventListener('mouseup', onDragEnd);
        });

        //---------modal----------------------------------
        this.$overlay = undefined;
        this.bind("modal", modal=>{
            if (modal){
                this.$overlay=$(`<div class="${ style.overlay }" style="z-index: ${ this._options.z_index-1 }"></div>`).appendTo('body');
            }else if(this.$overlay){
                this.$overlay.remove();
            }
        });


        //---------minimize----------------------------------
        this.bind("isMinimized", isMinimized =>{
            if (isMinimized){
                $view.hide();
            }else{
                $view.show();
            }
        });

        //---------maximize----------------------------------
        this.bind("isMaximized", isMaximized =>{
            if (isMaximized){
                this.$markup.css({
                    top:0,
                    left:0,
                    bottom:0,
                    right:0
                });
                $view.css({width:"100%",height:"100%"});
            }else{
                this.$markup.css({
                    top:this._options.position.top,
                    left:this._options.position.left,
                    bottom:"unset",
                    right:"unset"
                });
                $view.css({
                    width: this._options.width ? `${this._options.width}px`: "",
                    height: this._options.height ? `${this._options.height}px`: "",
                });
            }
        });

        //---------resize----------------------------------
        const $resizers = this.$markup.find(`.${ style.resize_handle }`);
        let resizer = undefined;
        const onEndResize = ()=>{
            dragPoint = undefined;
            position = undefined;
            window.removeEventListener("mousemove", onResize);
            window.removeEventListener("mouseup", onEndResize);
        }
        const onResize = e =>{
            if (e.buttons !== 1) return onEndResize();
            resizer( e );
        }
        $resizers.on("mousedown", e =>{

            if ((!this._options.resizable) || this._options.isMaximized || this._options.isMinimized) return;

            this._resizeObserver?.disconnect();
            this._resizeObserver=undefined;

            resizer = this._initResizer( e );

            window.addEventListener('mousemove', onResize);
            window.addEventListener('mouseup', onEndResize);
        });

        this.bind("resizable", resizable=>{
            if (resizable){
                $resizers.show();
            }else{
                $resizers.hide();
            }
        });
    }

    widgets() {
        return {
            minimize:{
                view: controls.Button,
                options:{
                    events:{
                        click:()=> this.set({isMinimized: true})
                    },
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
                    } } }
                }
            },
            close:{
                view: controls.Button,
                options:{
                    events:{
                        click:() => this.destroy()
                    },
                    icon: `url("${ close }")`
                }
            },
            view: this._options.view,
        };
    }

    _initResizer( e ){
        const initX = e.clientX;
        const initY = e.clientY;
        const initPosition = this._options.position;
        const initWidth = this._options.width || this.$markup.width();
        const initHeight = this._options.height || this.$markup.height();

        if ($(e.target).hasClass(style.resize_n) ){
            return (e)=>{
                const shiftY = e.clientY - initY;
                this.set({
                    position: { left: initPosition.left, top: initPosition.top + shiftY },
                    height: initHeight - shiftY
                })
            }
        }else if($(e.target).hasClass(style.resize_e) ){
            return (e)=>{
                const shiftX = e.clientX - initX;
                this.set({ width: initWidth + shiftX })
            }
        }else if($(e.target).hasClass(style.resize_s) ){
            return (e)=>{
                const shiftY = e.clientY - initY;
                this.set({ height: initHeight + shiftY })
            }
        }else if ($(e.target).hasClass(style.resize_w) ){
            return (e)=>{
                const shiftX = e.clientX - initX;
                this.set({
                    position: { left: initPosition.left + shiftX, top: initPosition.top },
                    width: initWidth - shiftX
                })
            }
        }else if ($(e.target).hasClass(style.resize_se) ){
            return (e)=>{
                const shiftX = e.clientX - initX;
                const shiftY = e.clientY - initY;
                this.set({
                    width: initWidth + shiftX,
                    height: initHeight + shiftY
                })
            }
        }else if ($(e.target).hasClass(style.resize_sw) ){
            return (e)=>{
                const shiftX = e.clientX - initX;
                const shiftY = e.clientY - initY;
                this.set({
                    position: {top:initPosition.top, left: initPosition.left + shiftX},
                    width: initWidth - shiftX,
                    height: initHeight + shiftY
                })
            }
        }else if ($(e.target).hasClass(style.resize_ne) ){
            return (e)=>{
                const shiftX = e.clientX - initX;
                const shiftY = e.clientY - initY;
                this.set({
                    position: {
                        top:initPosition.top + shiftY,
                        left: initPosition.left
                    },
                    width: initWidth + shiftX,
                    height: initHeight - shiftY
                })
            }
        }else{
            return (e)=>{
                const shiftX = e.clientX - initX;
                const shiftY = e.clientY - initY;
                this.set({
                    position: {
                        top:initPosition.top + shiftY,
                        left: initPosition.left + shiftX
                    },
                    width: initWidth - shiftX,
                    height: initHeight - shiftY
                })
            }
        }
    }

    destroy() {
        if (this.$overlay){
            this.$overlay.remove();
            this.$overlay = undefined;
        }

        this._resizeObserver?.disconnect();
        this._resizeObserver=undefined;

        if (this._onDestroy){
            for (const d of this._onDestroy){
                d();
            }
            this._onDestroy = undefined;
        }
        super.destroy();
    }

}

Window.extend();