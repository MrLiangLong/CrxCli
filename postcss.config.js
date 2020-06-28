module.exports = {
	"plugins": {
		"postcss-import": {},
		"postcss-url": {},
		"postcss-each": {},
		"precss": {},
		// to edit target browsers: use "browserslist" field in package.json
		"autoprefixer": {
			add: true,
			remove: true,
			browsers: ['last 2 versions', 'Android >= 4', 'iOS >= 7']
		}
	}
}

/*
 * PostCss插件：
 * cssNext：用下一代css书写方式兼容现在浏览器;
 * AutoPrefixer:为css补全浏览器前缀
 * CssGrace:让Css兼容旧版本IE
 * post-modules：css模块化
 * */