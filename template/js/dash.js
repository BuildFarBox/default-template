// Generated by CoffeeScript 1.6.2
(function() {
  var DashBoard, TemplateChooser, auto_iframe, clone_template_gateway, content_gateway, exports, lang, main_menus;

  exports = this;

  this.lang_keys = {
    'zh_cn': {
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
      'Use this One': '使用这个模板',
      'Current Template of this Site': '当前正在使用的模板'
    }
  };

  clone_template_gateway = '/service/gateway/clone_template_by_key';

  content_gateway = '/service/gateway/sync';

  lang = navigator.language.toLowerCase().replace('-', '_');

  auto_iframe = function() {
    return $('.full-window iframe').css({
      height: $(window).height() - 3,
      width: $(window).width() - 100
    });
  };

  main_menus = [
    {
      title: get_text('Setup'),
      icon: "fa fa-cog",
      template: "setup-template"
    }, {
      title: get_text('Editor'),
      icon: "fa fa-edit",
      template: "editor-template",
      always_run: function() {
        auto_iframe();
        return window.onresize = auto_iframe;
      },
      body_overflow: true
    }, {
      title: get_text('Templates'),
      icon: "fa fa-windows",
      template: "templates-template",
      body_overflow: true,
      always_run: function() {
        $('.templates-container').css({
          height: $(window).height() - 70
        });
        return window.onresize = function() {
          return $('.templates-container').css({
            height: $(window).height() - 70
          });
        };
      }
    }, {
      title: get_text('Statistics'),
      icon: "fa fa-bar-chart-o",
      template: "st-template",
      always_run: function() {
        auto_iframe();
        return window.onresize = auto_iframe;
      },
      body_overflow: true
    }, {
      title: get_text('Pay'),
      icon: "fa fa-heart",
      template: "pay-template",
      always_run: function() {
        auto_iframe();
        return window.onresize = auto_iframe;
      },
      body_overflow: true
    }, {
      title: get_text('Docs'),
      icon: "fa fa-question",
      template: "doc-template",
      always_run: function() {
        auto_iframe();
        return window.onresize = auto_iframe;
      },
      body_overflow: true
    }
  ];

  this.ConfigPages = function(data) {
    var cell, config_page, config_pages, group, raw_config_pages, site, _i, _j, _k, _len, _len1, _len2, _ref, _ref1,
      _this = this;

    raw_config_pages = data["interface"] != null ? data["interface"] : [];
    site = data.site;
    this.i18n = function(obj, key) {
      return obj[key + '_' + lang] || obj[key] || '';
    };
    this.get_config_value = function(key, default_value) {
      var value;

      value = site.configs ? site.configs[key] || site[key] : site[key];
      if ($.type(value) === 'array') {
        value = value.join('\n');
      }
      if (default_value != null) {
        if (default_value === 'yes' || default_value === 'no') {
          if (value === true) {
            return 'yes';
          }
          if (value === false) {
            return 'no';
          }
        }
      }
      return value;
    };
    this.re_config_parts = function(raw_parts) {
      var folder, part, parts, row, _i, _j, _len, _len1, _ref, _ref1;

      parts = [];
      for (_i = 0, _len = raw_parts.length; _i < _len; _i++) {
        row = raw_parts[_i];
        part = {};
        part.key = row.key;
        part.id = 'fb_' + row.key;
        part.title = _this.i18n(row, 'title');
        part.default_value = row.default_value || '';
        part.value = _this.get_config_value(part.key, part.default_value);
        if (!row.model) {
          row.model = 'text';
        }
        part.model = row.model;
        if (part.model === 'select') {
          part.options = _this.i18n(row, 'options');
          if (part.options === 'root') {
            part.options = [
              {
                title: '/',
                value: '/'
              }
            ];
            _ref = data.folders;
            for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
              folder = _ref[_j];
              part.options.push({
                title: folder.path,
                value: folder.path
              });
            }
          }
        }
        if (part.model === 'check') {
          part.checked = (_ref1 = _this.get_config_value(part.key) || part.default_value) === 'on' || _ref1 === 'yes' || _ref1 === true;
        }
        if (part.model === 'textarea') {
          part.is_list = row.is_list || false;
        }
        parts.push(part);
      }
      return parts;
    };
    config_pages = [];
    for (_i = 0, _len = raw_config_pages.length; _i < _len; _i++) {
      config_page = raw_config_pages[_i];
      _ref = config_page.groups || [];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        group = _ref[_j];
        group.title = this.i18n(group, 'title');
        _ref1 = group.cells || [];
        for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
          cell = _ref1[_k];
          cell.parts = this.re_config_parts(cell.parts);
        }
      }
      config_pages.push(config_page);
    }
    return config_pages;
  };

  this.configs_to_text = function() {
    var content_dom, dom, dom_tag_name, dom_type, doms, id, line, lines, raw_text_value, text, _i, _j, _k, _len, _len1, _len2;

    doms = $('.fb_config');
    if (!doms.length) {
      return '';
    }
    text = '---\n';
    for (_i = 0, _len = doms.length; _i < _len; _i++) {
      dom = doms[_i];
      dom_tag_name = dom.tagName.toLowerCase();
      id = dom.id.replace('fb_', '');
      dom = $(dom);
      if (dom_tag_name === 'textarea' && id !== 'raw_content') {
        raw_text_value = $.trim(dom.val());
        if (!raw_text_value) {
          text += id + ': \n';
          continue;
        }
        lines = raw_text_value.split('\n');
        if (dom.hasClass('is_list')) {
          text += id + ':\n';
          for (_j = 0, _len1 = lines.length; _j < _len1; _j++) {
            line = lines[_j];
            text += '- ' + line + '\n';
          }
        } else {
          text += id + ': |\n';
          for (_k = 0, _len2 = lines.length; _k < _len2; _k++) {
            line = lines[_k];
            text += '  ' + line + '\n';
          }
        }
      } else {
        dom_type = dom.attr('type');
        if (dom_type === 'text' || dom_tag_name === 'select') {
          text += id + ': ' + dom.val() + '\n';
        }
        if (dom_type === 'checkbox') {
          text += id + ': ' + (dom.attr('checked') ? 'yes' : 'no') + '\n';
        }
      }
    }
    text += '---\n';
    content_dom = $('#fb_raw_content');
    if (content_dom.length) {
      text += content_dom.val();
    }
    return text;
  };

  DashBoard = function(data) {
    var site, _i, _len, _ref,
      _this = this;

    this.data = data;
    _ref = this.data.sites;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      site = _ref[_i];
      if (!site.domain) {
        site.domain = site.tmp_domain;
      }
    }
    this.menus = main_menus;
    this.current_menu = ko.observable(0);
    this.click_menu = function(index) {
      var menu;

      menu = _this.menus[index];
      _this.current_menu(index);
      if (menu.func && !menu.ever_clicked) {
        menu.func();
        menu.ever_clicked = true;
      }
      if (menu.always_run) {
        menu.always_run();
      }
      return $(document.body).css({
        'overflow': menu.body_overflow ? 'hidden' : 'auto'
      });
    };
    this.config_pages = new ConfigPages(data);
    this.current_config_page = ko.observable(0);
    this.sites = ko.observableArray(this.data.sites);
    this.site = this.data.site;
    this.site.domain = this.site.domain || this.site.tmp_domain;
    this.url_query_part = ko.observable(location.search);
    this.current_site_domain = ko.observable(this.site.domain);
    this.current_site_domain.subscribe(function(domain) {
      if (domain) {
        return window.location.href = 'http://' + domain + '/admin';
      } else {
        return alert('domain of this site is not valid');
      }
    });
    this.save_configs = function() {
      var config_path, submit_dom;

      submit_dom = $('button');
      submit_dom.removeClass('pure-button-primary');
      submit_dom.text('Working...');
      config_path = _this.site.config_path || 'site.txt';
      return $.post(content_gateway, {
        path: config_path,
        raw_content: configs_to_text()
      }, function() {
        submit_dom.addClass('pure-button-primary');
        submit_dom.text(get_text('Save Configs'));
        return Essage.show({
          message: get_text('Configs are saved!'),
          status: 'success'
        }, 3000);
      });
    };
    this.template_chooser = new TemplateChooser(this);
    return this;
  };

  TemplateChooser = function(dash) {
    var template_package, _i, _len, _ref,
      _this = this;

    this.template_packages = [];
    this.template_packages.push({
      title: get_text('Default Template'),
      template_key: 'default'
    });
    _ref = dash.data.template_packages;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      template_package = _ref[_i];
      this.template_packages.push(template_package);
    }
    this.site = dash.site;
    this.current_used = ko.observable(this.site.template_key || 'default');
    this.current_template_key = ko.observable('');
    this.this_used_now = ko.computed(function() {
      if (_this.current_used() === _this.current_template_key() && _this.current_used()) {
        return true;
      } else {
        return false;
      }
    });
    this.show_chooser_button = ko.computed(function() {
      if (_this.this_used_now()) {
        return false;
      } else {
        if (!_this.current_template_key()) {
          return false;
        } else {
          return true;
        }
      }
    });
    this.use_this_template = function() {
      var request_data;

      if (_this.current_template_key()) {
        request_data = {
          auto_update: true,
          template_key: _this.current_template_key(),
          site_id: _this.site['_id']
        };
        $.post(clone_template_gateway, request_data);
        return _this.current_used(_this.current_template_key());
      }
    };
    return this;
  };

  exports.DashBoard = DashBoard;

  $(document).ready(function() {
    var url;

    url = '/admin-data';
    $.getJSON(url, {}, function(data) {
      var dashboard;

      dashboard = new DashBoard(data);
      exports.dashboard = dashboard;
      return ko.applyBindings(dashboard);
    });
    return window.onresize = auto_iframe;
  });

}).call(this);
