import optionsService from "../services/options.js";

const WIDGET_TPL = `
<div class="card widget">
    <div class="card-header">
        <div>           
            <button class="btn btn-sm widget-title" data-toggle="collapse" data-target="#[to be set]">
                Collapsible Group Item
            </button>
            
            <a class="widget-help external no-arrow bx bx-info-circle"></a>
        </div>
        
        <div class="widget-header-actions"></div>
    </div>

    <div id="[to be set]" class="collapse body-wrapper" style="transition: none;">
        <div class="card-body"></div>
    </div>
</div>
`;

class StandardWidget {
    /**
     * @param {TabContext} ctx
     * @param {Options} options
     * @param {object} sidebarState
     */
    constructor(ctx, options, sidebarState) {
        this.ctx = ctx;
        // construct in camelCase
        this.widgetName = this.constructor.name.substr(0, 1).toLowerCase() + this.constructor.name.substr(1);
        this.widgetOptions = options.getJson(this.widgetName) || {
            expanded: true
        };

        this.state = sidebarState.widgets.find(s => s.name === this.widgetName) || {
            expanded: this.widgetOptions.expanded
        };
    }

    getWidgetTitle() { return "Untitled widget"; }

    getHeaderActions() { return []; }

    getHelp() { return {}; }

    getMaxHeight() { return null; }

    getPosition() { return this.widgetOptions.position; }

    render() {
        const widgetId = `tab-${this.ctx.tabId}-widget-${this.widgetName}`;

        this.$widget = $(WIDGET_TPL);
        this.$widget.find('[data-target]').attr('data-target', "#" + widgetId);

        this.$bodyWrapper = this.$widget.find('.body-wrapper');
        this.$bodyWrapper.attr('id', widgetId);

        if (this.state.expanded) {
            this.$bodyWrapper.collapse("show");
        }

        this.$body = this.$bodyWrapper.find('.card-body');

        const maxHeight = this.getMaxHeight();

        if (maxHeight) {
            this.$body.css("max-height", maxHeight);
            this.$body.css("overflow", "auto");
        }

        this.$widget.on('shown.bs.collapse', () => this.renderBody());
        this.$widget.on('shown.bs.collapse', () => this.ctx.stateChanged());
        this.$widget.on('hidden.bs.collapse', () => this.ctx.stateChanged());

        this.$title = this.$widget.find('.widget-title');
        this.$title.text(this.getWidgetTitle());

        this.$help = this.$widget.find('.widget-help');
        const help = this.getHelp();

        if (help.title) {
            this.$help.attr("title", help.title);
            this.$help.attr("href", help.url || "javascript:");

            if (!help.url) {
                this.$help.addClass('no-link');
            }
        }
        else {
            this.$help.hide();
        }

        this.$headerActions = this.$widget.find('.widget-header-actions');
        this.$headerActions.append(...this.getHeaderActions());

        // actual rendering is async
        this.renderBody();

        return this.$widget;
    }

    async renderBody() {
        if (!this.isExpanded() || this.rendered) {
            return;
        }

        this.rendered = true;

        await this.doRenderBody();
    }

    /** for overriding */
    async doRenderBody() {}

    async isEnabled() {
        const label = await this.ctx.note.getLabelValue(this.widgetName);

        if (label === 'enabled') {
            return true;
        } else if (label === 'disabled') {
            return false;
        }
        else {
            return this.widgetOptions.enabled;
        }
    }

    isExpanded() {
        return this.$bodyWrapper.hasClass("show");
    }

    getWidgetState() {
        return {
            name: this.widgetName,
            expanded: this.isExpanded()
        };
    }

    eventReceived(name, data) {}

    cleanup() {}
}

export default StandardWidget;