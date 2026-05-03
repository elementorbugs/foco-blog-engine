/**
 * FOCO theme — front-end JS
 *  - Toggles a "scrolled" class on the fixed nav once the user has scrolled
 *  - Wires up the FAQ accordion (click question → expand/collapse answer)
 */
(function () {
	'use strict';

	function initNav() {
		var nav = document.getElementById('foco-nav');
		if (!nav) return;
		var onScroll = function () {
			if (window.scrollY > 24) {
				nav.classList.add('scrolled');
			} else {
				nav.classList.remove('scrolled');
			}
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
	}

	function initFaq() {
		var qs = document.querySelectorAll('.foco-app .faq-q');
		qs.forEach(function (btn) {
			btn.addEventListener('click', function () {
				btn.parentElement.classList.toggle('open');
			});
		});
	}

	function ready(fn) {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', fn);
		} else {
			fn();
		}
	}

	ready(function () {
		initNav();
		initFaq();
	});
})();
