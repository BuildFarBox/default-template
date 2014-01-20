@login = (url_after_login)->
    offset = - (new Date()).getTimezoneOffset()/60.0
    url = '/login?auto_close=true&utc_offset=' + offset
    if url_after_login
        url += '&redirect='+url_after_login
    dialog_args = 'dialogWidth=1018px;dialogHeight=680px;dialogTop=122px'
    status = window.showModalDialog(url, null, dialog_args)
    if status == undefined
        status = window.returnValue
    if status
        if  Essage?
            Essage.hide()
        @is_login = true
        return true
    if typeof(status)=='string'
        window.location.href = status
    return false

@new_post = ->
    now = new Date()
    today = now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate()
    url = '/post/'+today+'?action=create'
    window.location.href = url
    return false

@get_text = (key, keys)->
    if lang_keys? and not keys
        keys = lang_keys
    lang = navigator.language.toLowerCase().replace('-', '_')
    texts = keys[lang]
    if texts
        return texts[key+'_'+lang] or texts[key] or key
    else
        return key
