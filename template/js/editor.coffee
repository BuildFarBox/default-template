api_url = '/service/gateway/sync'
lang = navigator.language.toLowerCase().replace('-', '_')

doc = this

insert_dom = (dom)->
    node = $(dom)[0]
    if window.getSelection
        sel = window.getSelection()
        if (sel.getRangeAt && sel.rangeCount)
            range = sel.getRangeAt(0)
            range.deleteContents()
            range.insertNode(node)


cookie_tmp_doc = (path, content)->
    path = $.trim(path)
    content = $.trim(content)
    if not path or not content
        return false
    base64_content = $.base64.btoa(content, true)
    per = 3600
    parts = Math.ceil(base64_content.length/per)
    if parts > 10 # roude about (max) 1.8w letters
        return false
    else
        $.cookie('sync_tmp_path', path, { expires: 7, path: '/' })
    for i in [0..parts-1]
        key = 'sync_tmp_content_' + i
        start = i*per
        end = (i+1)*per
        $.cookie(key, base64_content.slice(start, end), { expires: 7, path: '/' })
    return true



SmartImagesLoader = (editor) ->
    @dom = editor.dom
    @editor = editor
    self = this
    @canvas =  document.createElement('canvas')
    @cx = @canvas.getContext('2d')

    $(@dom)[0].addEventListener  'drop', (event)=>
        files = event.dataTransfer.files
        url = window.URL or window.webkitURL
        objURL = url.createObjectURL or false

        for file in files
            if file.type.indexOf( 'image' ) == -1
                continue
            if objURL
                @load_image(objURL(file))
            else
                reader = new FileReader()
                reader.readAsDataURL(file)
                reader.onload = (ev)=>
                    @load_image(ev.target.result)
        event.preventDefault()
    , false

    $(@dom)[0].addEventListener 'dragover', (event)->
        event.preventDefault()
    , false


    @load_image = (file)=>
        img = new Image()
        img.src = file
        insert_dom(img)

        # get the image data and upload to server, then replace the img dom with the image path (src)
        $(img).one 'load', ->
            if not self.editor.login
                return

            width = @naturalWidth or @width
            height = @naturalHeight or @height
            thumb_height = 2560
            thumb_width = 1280
            width_r = width/thumb_width
            height_r = height/thumb_height
            max_r = Math.max(width_r, height_r)
            w = if max_r>1 then width/max_r else width
            h = if max_r>1 then height/max_r else height

            self.canvas.width = w
            self.canvas.height = h
            self.cx.drawImage(this, 0, 0, w, h)

            image_path = '/_image' + $.format.date(new Date(), '/yyyy-MM-dd/HH-mm-ss') + '.jpg'

            request_data = {path: image_path, base64: self.canvas.toDataURL( 'image/jpeg' , 0.96)}

            $.post api_url, request_data, (resposne_data, status)->
                if status == 'success'
                    new_img = new Image()
                    new_img.src = image_path
                    # load from webserver
                    $(new_img).one 'load', ->
                        img.src = image_path
                        editor.sync() # sync the text.
                    if new_img.complete
                        $(new_img).load()

        if img.complete
            $(img).load()

    @upload_images = =>
        if not @editor.login #ignore
            return false
        if @uploaded_already? # 为了避免冲突，图片只会被上传一次，但在没有登录前，是不上传的
            return false
        for img in @dom.find('img') # 主要是处理未登录前插入的图片
            if img.src and (img.src.indexOf('blob:')==0 or img.src.indexOf('data:')==0)
                if img.comlete
                    $(img).load()
        @uploaded_already = true

    return this




SmartEditor = (dom)->
    @dom = $(dom)


    @need_sync = false
    @login = false

    @init = =>
        if @editor
            return

        container = dom
        for i in [0..3] # 最多查3层
            if container.prev().attr('class') == 'title'
                title_dom = container.prev()
            else if container.next().attr('class') == 'title'
                title_dom = container.next()
            else
                container = container.parent()

        if title_dom
            title_dom = title_dom.children() if title_dom.children().length == 1
            color = title_dom.css('color')
            @input_dom = $('<input type="text" style="width:100%; border:none">')
            @input_dom.css({color:title_dom.css('color'), 'line-height': title_dom.css('line-height'), 'font-size':title_dom.css('font-size')})
            title_text = $.trim(title_dom.text()) or get_text('input_title')
            @input_dom.val(title_text)
            title_dom.replaceWith(@input_dom)

            @input_dom.keyup (event) =>
                if event.which == 13
                    @dom.focus()
                @sync()

            if not $.trim(@dom.text())
                @input_dom.focus()

        options = {
            editor: @dom[0],
            list: [
                'blockquote', 'h2', 'h3', 'p', 'inserthorizontalrule',
                  'bold', 'italic', 'createlink', 'insertorderedlist', 'insertunorderedlist'
            ],
            stay: false
        }

        @editor = new Pen(options);

        @editor._menu.addEventListener 'click', (e)=>
            action = e.target.getAttribute('data-action')
            if action
                @need_sync = true


    @get_content = =>
        if @input_dom
            text = 'title: '+@input_dom.val()+'\n\n'
        else
            text = ''
        text += $.trim(toMarkdown(@dom.html()))
        return text

    @get_path = =>
        path_dom = @dom.prev('input[type=hidden]')
        if path_dom
            path = path_dom.val()
            if not path
                _path = location.pathname.split('/').slice(2).join('/')
                if _path # 从路径中判断
                    return _path + '.txt'
                else # 取日期
                    return $.format.date(new Date(), 'yyyy-MM-dd') + '.txt'
            return path
        else
            return ''

    @sync_per_seconds = 30 # 30秒同步一次
    @sync = =>
        doc.no_reload = true # 禁止autoreload的刷新页面的行为

        if not @keep_sync_set
            @keep_sync_set = true
            setInterval(@keep_sync, 10*1000) # 键盘闲置10秒的时候，自动同步

        @uploader.upload_images()

        if not @last_sync_at # first time try to input
            @last_sync_at = new Date() - @sync_per_seconds*1000 + 10*1000 # 这样只要10秒后就会触发一次同步

        if new Date() - @last_sync_at < @sync_per_seconds * 1000
            @need_sync = true # 本次没有同步，但已经发生了变更，需要后续补充性的同步
            return false
        else
            @need_sync = false
            @last_sync_at = new Date()

        path = @get_path()
        if not path
            return # ignore

        # try to sync
        data = {
            path: @get_path(),
            raw_content: @get_content()
        }

        $.post api_url, data, (response_data)=>
            if response_data.error_code
                message = response_data.message
                if response_data.error_code == 401
                    message += ' <a href="#" onclick="javascript:login()" >Click Here</a>'
                Essage.show({message: message, status:'error'})
            else
                @login = true

    @keep_sync = =>
        # 当键盘不输入了的时候，尝试去同步
        if not @need_sync
            return # ignore
        else
            @sync()


    @dom.keyup (e) =>
        @sync()



    @uploader = new SmartImagesLoader(this)

    return this

@editors = []

$(document).ready =>
    for dom in $('.fb-editor')
        editor = new SmartEditor($(dom))
        editor.init()
        @editors.push(editor)

Tips = {
    'content_not_saveed': 'The content is not saved yet, Please wait for a moment!',
    'content_not_saveed_zh_cn': '内容正在保存，请稍后关闭！',
    'image_uploading': 'Images are still uploading, Please wait for a moment!',
    'image_uploading_zh_cn': '图片尚在上传，请稍后关闭！',
    'input_title': 'Hi, FarBox!',
}

get_text = (key)->
    return Tips[key+'_'+lang] or Tips[key]


window.onbeforeunload = =>
    stay = false
    for editor in @editors
        imgs = $(editor.dom).find('img')
        for img in imgs
            if img.src and (img.src.indexOf('blob:')==0 or img.src.indexOf('data:')==0)
                return get_text('image_uploading')
        if editor.need_sync
            cached = cookie_tmp_doc(editor.get_path(), editor.get_content())
            if not cached
                editor.sync()
                stay = true
    return if stay then get_text('content_not_saved') else null

