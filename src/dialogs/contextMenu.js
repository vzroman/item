
import {View as ItemView} from "../view/item.js";
import styles from "./contextMenu.css";
import {Controller as Collection} from "../controllers/collection";
import {view as views} from "../view/index.js";
import {types} from "../types";

let _activeMenu = null;

const destroyExisting = () => {
    if (_activeMenu) {
        _activeMenu.destroy();
        _activeMenu = null;
    }
};

/**
 * 
 * // Subscribe on events using standard jQuery `contextmenu`
 * @example
 * this.$markup.on("contextmenu", (e) =>{
 * 
 * @example
 * dialogs.contextMenu({
 *   items: [
 *     { caption: "Copy", handler: () => copy() },
 *     { caption: "Paste", handler: () => paste(), enable: () => hasClipboard() }
 *   ],
 *   x: e.clientX,
 *   y: e.clientY
 * }).then(selectedItem => {
 *   if (selectedItem) {
 *     console.log('Selected:', selectedItem.caption);
 *   }
 * });
 * 
 */
export function contextMenu(options) {
    if (Array.isArray(options)) {
        const [items, x, y] = arguments;
        options = { items, x, y };
    }

    const {
        items = [],
        x = 0,
        y = 0
    } = options;

    return new Promise((resolve) => {
        destroyExisting();

        const menu = new ContextMenuDialog({
            $container: $('body'),
            items,
            x,
            y,
            onResult: (result) => {
                _activeMenu = null;
                menu.destroy();
                resolve(result);
            }
        });

        _activeMenu = menu;
    });
}

class ContextMenuDialog extends ItemView {
    static options = {
        items: {type: types.primitives.Array, default: []},
        x: {type: types.primitives.Float},
        y: {type: types.primitives.Float},
        onResult: {type: types.primitives.Fun}
    };

    constructor(options) {
        super(options);
        
        this._preventBrowserMenu = (e) => {
            e.preventDefault();
            return false;
        };
        
        $(document).on('contextmenu', this._preventBrowserMenu);
        
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this._handleCancel();
            }
        };
        
        $(document).on('keydown', escapeHandler);
        
        this._cleanupHandlers = () => {
            $(document).off('contextmenu', this._preventBrowserMenu);
            $(document).off('keydown', escapeHandler);
        };
        
        setTimeout(() => {
            this.checkOverflow();
        });
    }

    markup() {
        const {x, y} = this._options;
        const $markup = $(`<div name="wrapper" class="${styles.wrapper}">
                    <div name="context_menu" style="top:${y}px;left:${x}px;" class="${styles.menu}">
                        <div name="items" style="padding:4px;"></div>
                    </div>
                </div>`);
        
        $markup.on("click mousedown", () => {
            this._handleCancel();
        });
        
        this.$contextmenu = $markup.find('[name="context_menu"]');
        this.$contextmenu.on("click mousedown", (e) => {
            e.stopPropagation();
        });
        this.$contextmenu.on("contextmenu", () => false);
        
        return $markup;
    }

    widgets() {
        const controller = new Collection({
            schema: {
                icon: {type: types.primitives.String},
                caption: {type: types.primitives.String},
                handler: {type: types.primitives.Fun},
                enable: {type: types.primitives.Fun},
            },
            data: this._options.items
        });

        return {
            items: {
                view: views.collections.Flex,
                options: {
                    data: controller,
                    item: {
                        view: MenuItem,
                        options: {
                            links: {
                                classes: {
                                    source: "data@enable", handler: (enable = () => {}) => {
                                        return enable() ? [] : [styles.disabled];
                                    }
                                }
                            },
                            events: {
                                click: (e, item) => {
                                    const itemData = item.get("data");
                                    const enable = itemData.get("enable");
                                    
                                    if (enable && !enable()) return;
                                    
                                    const handler = itemData.get("handler");
                                    const result = itemData.get();
                                    const onResult = this._options.onResult;
                                    
                                    destroyExisting();
                                    
                                    if (handler) {
                                        handler();
                                    }
                                    
                                    onResult?.(result);
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    _handleCancel() {
        this._options.onResult?.(null);
    }
    
    checkOverflow() {
        const windowWidth = $(window).width();
        const windowHeight = $(window).height();
        const menuWidth = this.$contextmenu.outerWidth();
        const menuHeight = this.$contextmenu.outerHeight();
        
        const overflowX = (this._options.x + menuWidth) > windowWidth;
        const overflowY = (this._options.y + menuHeight) > windowHeight;

        if (overflowX) {
            this.$contextmenu.css({"left": this._options.x - menuWidth});
        }
        if (overflowY) {
            this.$contextmenu.css({"top": this._options.y - menuHeight});
        }
    }
    
    _destroy() {
        if (this._cleanupHandlers) {
            this._cleanupHandlers();
        }
        super._destroy();
    }
}

ContextMenuDialog.extend();


class MenuItem extends ItemView {
    
    static markup = `<div class="${styles.menuitem}">
        <div name="icon" class="${styles.icon}"></div>
        <div name="caption" class="${styles.caption}"></div>
    </div>`

    widgets() {
        return {
            icon: {
                view: views.primitives.Html,
                options: {
                    links: {
                        html: {
                            source: "data@icon", 
                            handler: icon => icon ? `<img width="18" height="18" src="${icon}">` : ''
                        }
                    }
                }
            },
            caption: {
                view: views.primitives.Label,
                options: {
                    links: {
                        text: {source: "data@caption"},
                    }
                }
            }
        }
    }
}

MenuItem.extend();