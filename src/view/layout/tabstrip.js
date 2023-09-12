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
        const $markup= $(`<div class="${style.tab_container} ${ this._options.horizontal ? style.horizontal : style.vertical  } ">
            <div name="menu"></div>
            <div name="tab" class="${style.tab_content}"></div>
        </div>`);

        this.$tabContainer = $markup.find('[name="tab"]');
        return $markup;
    }

    constructor(options){
        super(options);
        this.bind("active", tab => this.changeView(tab));
    }

    changeView(id){
        this._tab?.destroy();
        this.$tabContainer.empty();

        const { view, options } = this._options.tabs[id] || this._options.tabs[0];
        this._tab = new view({
            $container: this.$tabContainer,
            data:this._options.data,
            ...options
        })
    }

    linkWidgets( context ){
        super.linkWidgets( context );
        this._tab?.link( context );
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
                        view: Control,
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

class Control extends Parent{

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
        const $markup = $(`<div class="${ style.tab_nav }" style="align-items: center;cursor: pointer">
            <div name="icon" style="display: none; width: 20px; height: 20px; background-size: contain; background-repeat: no-repeat;"></div>
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

Control.extend();

