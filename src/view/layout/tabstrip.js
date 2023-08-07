import {View as ItemView} from "../item.js";
import {types} from "../../types/index.js";
import {controllers} from "../../controllers";
import {View as Flex} from "../collections/flex.js"
// import {controls} from "../controls";
import {Control as Parent} from "../controls/control.js";
// import {types} from "../../types/index.js";
// import mainCss from "../../css/main.css";
import style from "./tabstrip.css";

export class View extends ItemView {

    static events = {onChange: true}

    static options = {
        tabs:{ type:types.complex.Collection, options:{schema:{
            text:{type: types.primitives.String },
            icon:{type: types.primitives.String },
            view:{type: types.primitives.Class, options:{ class: ItemView }, required:true },
            options:{type: types.primitives.Set }
        }}},
        active:{type:types.primitives.Integer, default: 0},
        horizontal:{type: types.primitives.Bool, default:true }
    };

    markup() {
        // TODO. css styles
        return `<div class="${style.tab_container} ${ this._options.horizontal ? style.horizontal : style.vertical  } ">
            <div name="menu"></div>
            <div name="tab" class="${style.tab_content}"></div>
        </div>`;
    }

    constructor(options){
        super(options);
        this._tabContainer = this.$markup.find('[name="tab"]');
        this.bind("active", tab => this.changeView(tab));
    }

    changeView(id){
        this._tab?.destroy();
        this._tabContainer.empty();

        const { view, options } = this._options.tabs[id] || this._options.tabs[0];
        this._tab = new view({
            $container: this._tabContainer,
            ...options,
        })
    }

    widgets() {
        const _menuController = new controllers.Collection({
            id:"text",
            schema:{
                text:{type: types.primitives.String },
                icon:{type: types.primitives.String },
                id: {type: types.primitives.Integer }
                // view:{type: types.primitives.Class, options:{ class:ItemView }, required:true },
                // options:{type: types.primitives.Set }
            },
            data: this._options.tabs.map((tab,i)=>{ 
                return {
                    id:i,
                    text:tab.text,
                    icon:tab.icon
                }
             } )
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
                            links: {text: "data@text", icon: "data@icon", classes: {
                                source:"data@id",
                                handler:(id)=> { 
                                    if (id === this._options.active){
                                        return ["active"]
                                    }else{ return [] }
                                }
                            }},
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
View.extend();

class Control extends Parent{

    static options = {
        text:{type:types.primitives.String},
        title:{type:types.primitives.String},
        icon:{type:types.primitives.String},
        white_space:{type:types.primitives.String, default:"nowrap"}
    };
    static markup = `<div class="${ style.tab_nav }" style="width:100%;height:100%;align-items: center;cursor: pointer">
        <div name="icon" style="display: none; width: 20px; height: 20px; background-size: contain; background-repeat: no-repeat;"></div>
        <div name="text"></div>
    </div>`;

    constructor( options ){
        super( options );

        this.bind("text", value => this.$markup.find('[name="text"]').text( value ));

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
            this.$markup.find('[name="icon"]').css( css );
        });

        this.bind("title", value => this.$markup.attr("title", value));
        this.bind("white_space", value => this.$markup.find('[name="text"]').css("white-space",value))
    }

    enable( value ){
        this.$markup.prop('disabled', !value);
    }

    focus(){
        this.$markup.focus();
    }
}

Control.extend();

