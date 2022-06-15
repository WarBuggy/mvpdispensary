


$(document).ready(function () {
  $('.aos-animation *, .aos-animation').not('a,a *,button').attr({
    'data-aos': "fade-up",
    'data-aos-duration': "500"
  });
  AOS.init();

  $('html').addClass('page-ready');

  if (typeof window.orientation !== 'undefined') {
    $('html').addClass('mobile-view');
  }

  var header = $('header.header-global');

  window.onscroll = function (event) {
    event.preventDefault();
    if ($('.mobile-view').length < 1) {
      stickyMenu();
    }
  };

  function stickyMenu() {
    if (window.pageYOffset > (header.height()) / 2) {
      header.addClass("sticky");
    } else {
      header.removeClass("sticky");
    }
  }
  /* Remove count down part
  // Set the date we're counting down to
  var countDownDate = new Date("May 1, 2022 00:00:00").getTime();
 
  // Update the count down every 1 second
  var x = setInterval(function() {
 
  // Get today's date and time
  var now = new Date().getTime();
 
  // Find the distance between now and the count down date
  var distance = countDownDate - now;
 
  // Time calculations for days, hours, minutes and seconds
  var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);
 
  // Output the result in an element with id="demo"
  $("#countdown").html(days + " ngày " + hours + " giờ " + minutes + " phút " + seconds + " giây ");
  + minutes + "m " + seconds + "s ";
 
  // If the count down is over, write some text 
  if (distance < 0) {
      clearInterval(x);
      document.getElementById("countdown").innerHTML = "EXPIRED";
  }
 
  if(days > 1)
  {
      $(".tool-countdown").html("Đếm ngược " + days + " ngày");
  }
  if(days < 1 && distance > 0)
  {
      $(".tool-countdown").html(hours + " giờ " + minutes + " phút " + seconds  + " giây ");
  }
  }, 1000);
  */

  height = $(window).height() - $('.toolbar').height();
  if (height < 500) {
    height = 600;
  }
  $('.margin-height').css('margin-top', -height / 3 + 'px');
  $('.window-height').css('min-height', height + 'px');
  $('.window-half').css('min-height', height / 2 + 'px');
  $('.window-height-2').css('min-height', height * 2 + 'px');
  //ready

  $(".light-on").click(function () {
    $('html').toggleClass('darkmode');
  });

  $(".page-product .gallery-item").not('.active').on('click', function (event) {
    $(".page-product .gallery-item.active").removeClass('active');
    $(".gallery-list.active").removeClass('active');
    $(this).addClass('active');
    src = $(this).find('img').attr('src');
    $(".page-product .main-photo").attr('src', $(this).find('img').attr('src'));
    $(".product-gallery .gallery-link").attr("href", src);
  });

  //nojs
  $('body').removeClass('no-js');

  //------------------------------------------------------------------------//

  //fakelink
  $('a[href="#"]').on('click', function (event) {
    event.preventDefault();
  });

  //------------------------------------------------------------------------//

  //placeholder
  $('input[placeholder], textarea[placeholder]').placeholder();

  //------------------------------------------------------------------------//

  //navigation
  $('.navigation-toggle').on('click', function (event) {
    event.preventDefault();
    $('body').toggleClass('navigation-open');
  });
  $('.menu-item-has-children').each(function (index, el) {
    $(this).append('<span class="toggle-children"><span></span></span>')
  });
  $(document).on('click', '.toggle-children', function (event) {
    event.preventDefault();
    $('.menu-item-has-children.mobile-active').removeClass('mobile-active');
    $(this).parent('li').toggleClass('mobile-active');
  });

  //------------------------------------------------------------------------//

  $('.accordion-title').on('click', function (event) {
    event.preventDefault();
    $(this).parents('.accordion-item').toggleClass('open');
  });

  //------------------------------------------------------------------------//

  //tab
  $('.tabs').delegate('li:not(.active)', 'click', function () { $(this).addClass('active').siblings().removeClass('active').parents('.tab').find('.box').hide().eq($(this).index()).fadeIn(400) });

  //------------------------------------------------------------------------//

  //scroll link
  $('a.scroll-link').click(function () {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html').removeClass('navigation-open');
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 600);
        return false;
      }
    }
  });

  //------------------------------------------------------------------------//

  //slider
  $('.tech-info-slider').slick({
    dots: false,
    arrows: true,
    draggable: true,
    infinite: false,
    centerMode: false,
    centerPadding: '0px',
    autoplay: false,
    autoplaySpeed: 5000,
    speed: 500,
    pauseOnHover: false,
    pauseOnDotsHover: false,
    slide: '.tech-info-item',
    slidesToShow: 1,
    slidesToScroll: 1,
    //asNavFor: '',
    //fade: true
  });

  //------------------------------------------------------------------------//

  //slider
  $('.blog-slider').slick({
    dots: false,
    arrows: true,
    draggable: true,
    infinite: true,
    centerMode: false,
    centerPadding: '0px',
    autoplay: false,
    autoplaySpeed: 5000,
    speed: 500,
    pauseOnHover: false,
    pauseOnDotsHover: false,
    slide: '.blog-item',
    slidesToShow: 3,
    slidesToScroll: 1,
    //asNavFor: '',
    //fade: true,
    responsive: [
      {
        breakpoint: 991,
        settings: {
          slidesToShow: 2
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  });

  //slider
  $('.product-slider').slick({
    dots: false,
    arrows: true,
    draggable: true,
    infinite: true,
    centerMode: false,
    centerPadding: '0px',
    autoplay: false,
    autoplaySpeed: 5000,
    speed: 500,
    pauseOnHover: false,
    pauseOnDotsHover: false,
    slide: '.product-item',
    slidesToShow: 4,
    slidesToScroll: 1,
    //asNavFor: '',
    //fade: true,
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  });

  //------------------------------------------------------------------------//

  $('.coach-bar-title').on('click', function (event) {
    event.preventDefault();
    $('.coach-bar').toggleClass('coach-bar-open');
  });

  if ($('body').innerWidth() < 767) {
    $('.coach-bar').removeClass('coach-bar-open');
  }

  //------------------------------------------------------------------------//

  $('.content-slider-js').slick({
    dots: false,
    arrows: true,
    draggable: true,
    infinite: true,
    centerMode: false,
    centerPadding: '0px',
    autoplay: false,
    autoplaySpeed: 5000,
    speed: 500,
    pauseOnHover: false,
    pauseOnDotsHover: false,
    slide: '.content-slider-item',
    slidesToShow: 3,
    slidesToScroll: 1,
    //asNavFor: '',
    //fade: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  });

  //------------------------------------------------------------------------//

  $('[data-fancybox="gallery"]').fancybox({
    infobar: false,
    buttons: [
      "close"
    ],
    thumbs: {
      autoStart: true
    }
  });

  $('[data-fancybox="video"]').fancybox({
    infobar: false,
    buttons: [
      "close"
    ]
  });

  //------------------------------------------------------------------------//

  //elite
  $('.home-elite-photos').slick({
    dots: false,
    arrows: false,
    draggable: true,
    infinite: true,
    centerMode: true,
    centerPadding: '33%',
    autoplay: false,
    autoplaySpeed: 5000,
    speed: 500,
    pauseOnHover: false,
    pauseOnDotsHover: false,
    slide: '.home-elite-photos-item',
    slidesToShow: 1,
    slidesToScroll: 1,
    asNavFor: '.home-elite-content',
    focusOnSelect: true,
    //fade: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          centerPadding: '0',
          arrows: true,
        }
      }
    ]
  });

  $('.home-elite-content').slick({
    dots: false,
    arrows: false,
    draggable: true,
    infinite: true,
    centerMode: false,
    centerPadding: '0px',
    autoplay: false,
    autoplaySpeed: 5000,
    speed: 500,
    pauseOnHover: false,
    pauseOnDotsHover: false,
    slide: '.home-elite-content-item',
    slidesToShow: 1,
    slidesToScroll: 1,
    asNavFor: '.home-elite-photos',
    fade: true
  });

  //------------------------------------------------------------------------//

  //slider
  $('.home-coaches-slider').slick({
    dots: false,
    arrows: true,
    draggable: true,
    infinite: false,
    centerMode: false,
    centerPadding: '0px',
    autoplay: false,
    autoplaySpeed: 5000,
    speed: 500,
    pauseOnHover: false,
    pauseOnDotsHover: false,
    slide: '.home-coaches-item',
    slidesToShow: 2,
    slidesToScroll: 1,
    //asNavFor: '',
    //fade: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  });

  //------------------------------------------------------------------------//

  //slider
  $('.home-hero-slider').slick({
    dots: true,
    arrows: false,
    draggable: true,
    infinite: true,
    centerMode: false,
    centerPadding: '0px',
    autoplay: true,
    autoplaySpeed: 5000,
    speed: 500,
    pauseOnHover: false,
    pauseOnDotsHover: false,
    slide: '.home-hero-item',
    slidesToShow: 1,
    slidesToScroll: 1,
    //asNavFor: '',
    fade: false
  });

  $('.home-hero-slider').on('beforeChange', function (event, slick, currentSlide, nextSlide) {
    var nextSliderObj = $('.home-hero-item[data-slick-index="' + nextSlide + '"]');
    nextSliderObj.find('.title-hide').removeClass('title-hidden');
  });

  $('.home-hero-slider').on('afterChange', function (event, slick, currentSlide) {
    var nextSliderObj = $('.home-hero-item[data-slick-index="' + currentSlide + '"]');
    nextSliderObj.find('.title-hide').addClass('title-hidden');
  });

  $('.video').each(function (index, el) {
    $(this)[0].play();
  });

  //------------------------------------------------------------------------//

  //slider
  $('.home-features-mobile').slick({
    dots: false,
    arrows: true,
    draggable: true,
    infinite: false,
    centerMode: false,
    centerPadding: '0px',
    autoplay: false,
    autoplaySpeed: 5000,
    speed: 500,
    pauseOnHover: false,
    pauseOnDotsHover: false,
    slide: '.home-features-mobile-item',
    slidesToShow: 1,
    slidesToScroll: 1,
    //asNavFor: '',
    //fade: true
  });


}); //document ready

//*********************************************************************//

$(window).load(function () {

  //load
  $('.title-hide').addClass('title-hidden');

});//window load

//*********************************************************************//

$(window).resize(function () {

  //resize

});//window resize