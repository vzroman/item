import {View as ItemView} from "../item.js";
import {types} from "../../types/index.js";
import {controllers} from "../../controllers";
import {View as Flex} from "../collections/flex.js"
import {Control as Parent} from "../controls/control.js";
import style from "./tabstrip.css";

export class TabStrip extends ItemView {

    static events = {onChange: true}

    static options = {
        tabs:{ type:types.complex.Collection, options:{schema:{
            text:{type: types.primitives.String },
            icon:{type: types.primitives.String },
            disabled: {type: types.primitives.Bool, default: false},
            view:{type: types.primitives.Class, options:{ class: ItemView }, required:true },
            options:{type: types.primitives.Set }
        }}},
        active:{type:types.primitives.Integer, default: 0},
        horizontal:{type: types.primitives.Bool, default:true },
        disabledTabs:{type: types.primitives.Array, default:[]}
    };

    markup() {
        const $markup = $(`<div class="${style.tab_container} ${this._options.horizontal ? style.horizontal : style.vertical}">
            <div class="${style.menu_wrapper}" style="position:relative;">
                <div name="menu"></div>
            </div>
            <div name="tab" class="${style.tab_content}"></div>
        </div>`);
        this.$tabContainer = $markup.find('[name="tab"]');
        return $markup;
    }

    constructor(options){
        super(options);
        this.bind("active", tab => this.changeView(tab));
        this._resizeHandler = this._debounce(() => this._renderOverflowMenu(), 150);
        this._isResizing = false; // флаг активности пересчёта

        // TODO: решить проблему с гонкой ResizeObserver и setTimeout при первой инициализации
        this._menuResizeObserver = new ResizeObserver(() => {
            if(this._isResizing) return;
            this._resizeHandler();
        });
    }

    changeView(id){
        this._tab?.destroy();
        this.$tabContainer.empty();

        const { view, options } = this._options.tabs[id] || this._options.tabs[0];
        this._tab = new view({
            $container: this.$tabContainer,
            data:this._options.data,
            ...options
        });

        if (this._linkContext){
           this._tab.link( this._linkContext );
        }
    }

    linkWidgets( context ){
        this._linkContext = {...this._linkContext,...context};
        super.linkWidgets( this._linkContext );
        this._tab?.link( this._linkContext );

        const $menu = this.$markup.find('[name="menu"]');
            if ($menu.length) {
                this._menuResizeObserver.observe($menu[0]);
            }

        setTimeout(() => this._renderOverflowMenu(), 0);
    }

    destroy() {
        if (this._menuResizeObserver) {
            this._menuResizeObserver.disconnect();
            this._menuResizeObserver = null;
        }

        super.destroy();
    }

    _debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    _renderOverflowMenu() {
        if (!this.$markup) return;
        this._isResizing = true; 

        try {
            const reserveWidth = 40;
            const $menu = this.$markup.find('[name="menu"]');
            const $flex = $menu.children().first('.flex-collection');
            const $tabs = $flex.children(':not(.overflow-tab-menu)');
            const containerWidth = $menu.width();

            // Если раньше был создан список скрытых вкладок — восстановим их
            if (this._hiddenTabs && this._hiddenTabs.length) {
                for (const $el of this._hiddenTabs) {
                    $flex.find('.overflow-tab-menu').before($el);
                }
                this._hiddenTabs = [];
            }

            $flex.find('.overflow-tab-menu').remove();

            let total = 0;
            let hiddenFrom = -1;

            $tabs.each((i, el) => {
                total += $(el).outerWidth(true);
                if (total + reserveWidth > containerWidth && hiddenFrom === -1) {
                    hiddenFrom = i;
                }
            });

            if (hiddenFrom === -1) return;

            // Отделяем скрытые элементы
            const hidden = $tabs.slice(hiddenFrom).toArray();
            this._hiddenTabs = hidden; 

            const $more = $(`
                <div 
                    class="${style.tab_nav} overflow-tab-menu" 
                    style="cursor:pointer; position:relative; display:flex; align-items:center; justify-content:center; flex-shrink:0; max-height:16px; text-align:center; margin-left:auto;">
                    ⋯
                    <div class="tabdrop-menu" style="display:none; position:absolute; top:100%; right:0; background:#fff; border:1px solid #ccc; z-index:10000;"></div>
                </div>
            `);

            const $dropdown = $more.find('.tabdrop-menu');

            hidden.forEach((el, i) => {
                const $el = $(el);
                const index = hiddenFrom + i;
                $el.on('click', () => {
                    this.set({ active: index });
                    $dropdown.hide();
                });
                $dropdown.append($el);
            });

            $more.on('click', e => {
                e.stopPropagation();
                console.log('toggle dropdown');

                $('.tabdrop-menu').not($dropdown).hide();
                $dropdown.toggle();
            });

            $(document).off('click.tabdrop').on('click.tabdrop', () => $dropdown.hide());

            $flex.append($more);
        } finally {
            setTimeout(() => this._isResizing = false, 30);
        }
        
    }


    widgets() {
        const _menuController = new controllers.Collection({
            id:"id",
            schema:{
                text:{type: types.primitives.String },
                disabled: {type: types.primitives.Bool, default: false},
                icon:{type: types.primitives.String },
                id: {type: types.primitives.Integer },
                isActive:{type: types.primitives.Bool }
            },
            data: this._options.tabs.map((tab,i)=>{ 
                return {
                    id:i,
                    text:tab.text,
                    icon:tab.icon,
                    disabled: tab.disabled
                }
             } )
        });

        this.bind("active", active=>{
            for (const id of Object.keys(_menuController.get())) {
                _menuController.set({[id]:{isActive: Number(id) ===active}})
            }
        });

        this.bind("disabledTabs", tabs=>{
            for (const id of Object.keys(_menuController.get())) {
                _menuController.set({[id]:{ disabled:tabs.includes( Number(id) ) }});
            }
        });

        return {
            menu: {
                view: Flex,
                options:{
                    data: _menuController,
                    direction: this._options.horizontal ? "horizontal" : "vertical",
                    item:{
                        view: Tab,
                        options:{
                            links: {
                                text: "data@text",  
                                icon: "data@icon", 
                                classes: { source:"data@isActive", handler:(isActive)=> { 
                                    if (isActive){
                                        return [style.active]
                                    }else{ return [] }
                                }},
                                disabled: "data@disabled"
                            },
                            events:{ click:{ handler: (_, tab) => {
                                const active = tab.get("data").get("id");
                                this.set({active});
                            } } },
                            classes: [style.button_style],
                        }
                    }
                }
            }
        }
    }
}
TabStrip.extend();

class Tab extends Parent{

    static options = {
        text:{type:types.primitives.String},
        title:{type:types.primitives.String},
        icon:{type:types.primitives.String},
        white_space:{type:types.primitives.String, default:"nowrap"},
        disabled: {type: types.primitives.Bool, default: false}
    };

    static #disabledStyle = {
        color: "#9b9b9b", 
        opacity: "0.5"
    };

    markup(){
        const $markup = $(`<div class="${ style.tab_nav }">
            <div name="icon" style="display: none"></div>
            <div name="text"></div>
        </div>`);

        this.$text = $markup.find('[name="text"]');
        this.$icon = $markup.find('[name="icon"]');

        return $markup;
    };

    constructor( options ){
        super( options );
        const prevMarkupStyle = this.$markup.css(["color", "opacity"]);

        this.bind("text", value => this.$text.text( value ));

        this.bind("icon", value => {
            let css = value
                ?{
                    "background-image":value,
                    "display":"block"
                }
                :{
                    "background-image":"",
                    "display":"none"
                };
            this.$icon.css( css );
        });

        this.bind("title", value => this.$markup.attr("title", value));
        this.bind("white_space", value => this.$text.css("white-space",value))
        this.bind("disabled", value => {
            if (value) {
                this.$markup.css({ "pointer-events": "none", ...this.constructor.#disabledStyle });
            } else {
                this.$markup.css({ "pointer-events": "unset", ...prevMarkupStyle});
            }
        });
    }

    enable( value ){
        this.$markup.prop('disabled', !value);
    }

    focus(){
        this.$markup.focus();
    }
}

Tab.extend();

