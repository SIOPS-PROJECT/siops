$(function() {
  function buildMenuItem(name, iconClass) {
    return {
      name: name,
      icon: function(opt, $itemElement, key, item) {
          $itemElement.html(`
            <div class="separated-menu">
              <span>${name}</span>
              <i class="${iconClass} icon-menu-context"></i>
            </div>
          `);
        }
      }
    }

  $.contextMenu({
    selector: 'body',
    callback: (key, opts) => {
      if(key == "reload-page"){
        location.reload();
      }
    },
    items: {
      "edit": buildMenuItem('Editar', 'fa-solid fa-pen'),
      "reload-page": buildMenuItem('Actualizar información', 'fa-solid fa-rotate-right'),
      "sep1": "---------",
      "quit": {
        name: "Quit", 
        icon: "quit"
      }
    }
  });
});

function toggleNavbar(){
  $('.dropdown-menu-personalizado').toggleClass('drop');
  $('.change-rotation').toggleClass('drop')
}