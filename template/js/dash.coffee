exports = this

@lang_keys = {
    'zh_cn':{
        'Setup': '设置',
        'Statistics': '统计',
        'Templates': '网站模板',
        'Default Template': '默认模板',
        'Docs': '文档',
        'Domain': '域名',
        'Visit Site': '访问网站',
        'Logout': '登出',
        'Save Configs': '保存设置',
        'Configs are saved!': '设置已经保存了!',
        'Choose Templates...': '请选择模板...',
        'Use this One':'使用这个模板',
        'Current Template of this Site': '当前正在使用的模板',

    }
}

clone_template_gateway = '/service/gateway/clone_template_by_key'
content_gateway = '/service/gateway/sync'
lang = navigator.language.toLowerCase().replace('-', '_')



# 左侧的菜单定义

# 左侧菜单需要的函数

auto_iframe = ->
    $('.full-window iframe').css({height: $(window).height()-3, width: $(window).width()-100})


# boday_overflow -> 可以禁止滚动条， template-> 页面中使用哪块template, func-> 执行一次的, always_run-> 菜单每次点击，都会执行的
main_menus = [
    { title: get_text('Setup'), icon: "fa fa-cog", template: "setup-template" },
    {
        title: get_text('Editor'),
        icon: "fa fa-edit",
        template: "editor-template",
        always_run: ->
            auto_iframe()
            window.onresize = auto_iframe
        body_overflow: true
    },
    # 暂时停用域名注册、查询的功能, 避免第一次升级应付不过来
    #{
    #    title: get_text('Domain'),
    #    icon: "fa fa-globe",
    #    template: "domain-template",
    #    always_run: ->
    #        auto_iframe();
    #        window.onresize = auto_iframe;
    #    body_overflow: true
    #},
    {
        title: get_text('Templates'),
        icon: "fa fa-windows",
        template : "templates-template",
        body_overflow: true,
        always_run: ->
            $('.templates-container').css({height: $(window).height()-70})
            window.onresize = ->  $('.templates-container').css({height: $(window).height()-70})

    },
    {
        title: get_text('Statistics'),
        icon: "fa fa-bar-chart-o",
        template: "st-template",
        always_run: ->
            auto_iframe();
            window.onresize = auto_iframe;
        body_overflow: true
    },
    {
        title: get_text('Pay'),
        icon: "fa fa-heart",
        template: "pay-template",
        always_run: ->
            auto_iframe();
            window.onresize = auto_iframe;
        body_overflow: true
    },
    {
        title: get_text('Docs'),
        icon: "fa fa-question",
        template: "doc-template",
        always_run: ->
            auto_iframe();
            window.onresize = auto_iframe;
        body_overflow: true
    }
]


# 将原始的data中的config_pages转为knockout比较容易处理的数据
@ConfigPages = (data)->
    raw_config_pages = if data.interface? then data.interface else []
    site = data.site

    @i18n = (obj, key)=>
        obj[key + '_' + lang] or obj[key] or ''


    @get_config_value = (key, default_value)=>
        value = if site.configs then site.configs[key] or site[key] else site[key]
        if $.type(value) == 'array'
            value = value.join('\n')

        # somethings true means 'yes'
        if default_value?
            if default_value in ['yes', 'no']
                if value == true
                    return 'yes'
                if value == false
                    return 'no'

        return value

    @re_config_parts = (raw_parts)=>
        parts = []
        for row in raw_parts
            part = {}
            part.key = row.key
            part.id = 'fb_' + row.key
            part.title = @i18n(row, 'title')
            part.default_value = row.default_value or ''
            part.value = @get_config_value(part.key, part.default_value)
            if not row.model then row.model = 'text'
            part.model = row.model

            if part.model == 'select'
                part.options = @i18n(row, 'options')
                if part.options == 'root'
                    part.options = [{title: '/', value: '/'}]
                    for folder in data.folders
                        part.options.push({title: folder.path, value: folder.path})

            if part.model == 'check'
                part.checked = (@get_config_value(part.key) or part.default_value) in ['on', 'yes', true]

            if part.model == 'textarea'
                part.is_list = row.is_list or false

            parts.push(part)
        return parts


    config_pages = []
    for config_page in raw_config_pages
        for group in config_page.groups or []
            group.title = @i18n(group, 'title')
            for cell in group.cells or []
                cell.parts = @re_config_parts(cell.parts)
        config_pages.push(config_page)

    return config_pages

# 将页面的表单，转化成site.txt的内容
@configs_to_text = ->
    doms = $('.fb_config')
    if not doms.length
        return ''

    text = '---\n'
    for dom in doms
        dom_tag_name = dom.tagName.toLowerCase()
        id = dom.id.replace('fb_', '')
        dom = $(dom) # to Jquery type
        if dom_tag_name == 'textarea' and id!='raw_content'
            raw_text_value = $.trim(dom.val())
            if not raw_text_value
                text += id + ': \n'
                continue
            lines = raw_text_value.split('\n')
            if dom.hasClass('is_list') # a list
                text += id + ':\n'
                for line in lines
                    text += '- ' + line + '\n'
            else # plain text
                text += id + ': |\n'
                for line in lines
                    text += '  ' + line + '\n'
        else
            dom_type = dom.attr('type')
            if dom_type == 'text' or dom_tag_name == 'select'
                text += id + ': ' + dom.val() + '\n'
            if dom_type == 'checkbox'
                text += id + ': ' + (if dom.attr('checked') then 'yes' else 'no') + '\n'

    text += '---\n'

    content_dom = $('#fb_raw_content')
    if content_dom.length
        text += content_dom.val()

    return text


DashBoard = (data)->
    # deal with the main menus
    @data = data

    for site in @data.sites
        if not site.domain
            site.domain = site.tmp_domain

    # 处理左侧的菜单
    @menus = main_menus
    @current_menu = ko.observable(0)
    @click_menu = (index)=>
        menu = @menus[index]
        @current_menu(index)
        if menu.func and not menu.ever_clicked # menu.func是只执行一次的
            menu.func()
            menu.ever_clicked = true
        if menu.always_run then menu.always_run()
        $(document.body).css({'overflow': if menu.body_overflow then 'hidden' else 'auto'})


    @config_pages = new ConfigPages(data)
    @current_config_page = ko.observable(0)
    @sites = ko.observableArray(@data.sites)
    @site = @data.site
    @site.domain = @site.domain or @site.tmp_domain
    @url_query_part = ko.observable(location.search)

    # 处理网站的跳转 todo 这里需要再处理的
    @current_site_domain = ko.observable(@site.domain)
    @current_site_domain.subscribe (domain)->
        if domain
            window.location.href = 'http://'+ domain + '/admin'
        else
            alert('domain of this site is not valid')


    @save_configs = =>
        submit_dom = $('button')
        submit_dom.removeClass('pure-button-primary')
        submit_dom.text('Working...')
        config_path = @site.config_path or 'site.txt'
        $.post content_gateway, {path: config_path, raw_content: configs_to_text() }, ->
            submit_dom.addClass('pure-button-primary')
            submit_dom.text(get_text('Save Configs'))
            Essage.show({message: get_text('Configs are saved!'), status: 'success'}, 3000)
    # setup ends

    @template_chooser = new TemplateChooser(this)


    return this


TemplateChooser = (dash)->
    @template_packages = [] # all pks
    @template_packages.push({ title: get_text('Default Template'), template_key:'default' })
    for template_package in dash.data.template_packages
            @template_packages.push(template_package)

    @site = dash.site
    @current_used = ko.observable(@site.template_key or 'default') # current key on preview # opition bind need it!
    @current_template_key = ko.observable('')

    @this_used_now = ko.computed =>
        if @current_used() == @current_template_key() and @current_used()
            return true
        else
            return false

    @show_chooser_button = ko.computed =>
        if @this_used_now()
            return false
        else
            if not @current_template_key()
                return false
            else
                return true


    @use_this_template = =>
        if @current_template_key()
            request_data = {
                auto_update: true, # 我们自己提供的，总是保持更新
                template_key: @current_template_key(),
                site_id: @site['_id']
            };
            $.post(clone_template_gateway, request_data)

            @current_used(@current_template_key())



    return this

exports.DashBoard = DashBoard

$(document).ready ->
    url = '/admin-data'
    $.getJSON url, {}, (data)->
        dashboard = new DashBoard(data)
        exports.dashboard = dashboard
        ko.applyBindings(dashboard)

    window.onresize = auto_iframe





