// the prints wall inside the building (index.html's section.prints). a thumb opens
// big in .print_big, a click anywhere on that or esc puts it away
export class prints_wall {
  constructor(wall, big){
    this.big = big;
    this.big_img = big.querySelector('img');
    for(const btn of wall.querySelectorAll('.print')){
      btn.addEventListener('click', this.open.bind(this, btn.querySelector('img')));
    }
    big.addEventListener('click', this.close.bind(this));
    window.addEventListener('keydown', this.on_key.bind(this));
  }

  open(img){
    this.big_img.src = img.src;
    this.big_img.alt = img.alt;
    this.big.classList.add('on');
  }

  close(){
    this.big.classList.remove('on');
  }

  on_key(e){
    if(e.key === 'Escape') this.close();
  }
}
