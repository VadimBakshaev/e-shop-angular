import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductService } from '../../shared/services/product';
import { ProductType } from '../../../types/product.type';
import { OwlOptions } from 'ngx-owl-carousel-o';

@Component({
  selector: 'app-main',
  standalone: false,
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class MainComponent implements OnInit {
  private readonly productService = inject(ProductService);

  protected products = signal<ProductType[]>([]);
  protected reviews = [
    {
      name: 'Ирина',
      image: 'reviewer1.jpg',
      text: 'В ассортименте я встретила все комнатные растения, которые меня интересовали. Цены - лучшие в городе. Доставка - очень быстрая и с заботой о растениях. '
    },
    {
      name: 'Анастасия',
      image: 'reviewer2.jpg',
      text: 'Спасибо огромное! Цветок арека невероятно красив - просто бомба! От него все в восторге! Спасибо за сервис - все удобно сделано, доставили быстро. И милая открыточка приятным бонусом.'
    },
    {
      name: 'Илья',
      image: 'reviewer3.jpg',
      text: 'Магазин супер! Второй раз заказываю курьером, доставлено в лучшем виде. Ваш ассортимент комнатных растений впечатляет! Спасибо вам за хорошую работу!'
    },
    {
      name: 'Аделина',
      image: 'reviewer4.jpg',
      text: 'Хочу поблагодарить всю команду за помощь в подборе подарка для моей мамы! Все просто в восторге от мини-сада! А самое главное, что за ним удобно ухаживать, ведь в комплекте мне дали целую инструкцию.'
    },
    {
      name: 'Яника',
      image: 'reviewer5.jpg',
      text: 'Спасибо большое за мою обновлённую коллекцию суккулентов! Сервис просто на 5+: быстро, удобно, недорого. Что ещё нужно клиенту для счастья?'
    },
    {
      name: 'Марина',
      image: 'reviewer6.jpg',
      text: 'Для меня всегда важным аспектом было наличие не только физического магазина, но и онлайн-маркета, ведь не всегда есть возможность прийти на место. Ещё нигде не встречала такого огромного ассортимента!'
    },
  ];

  protected customOptions: OwlOptions = {
    loop: true,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    dots: false,
    margin: 24,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 2
      },
      740: {
        items: 3
      },
      940: {
        items: 4
      }
    },
    nav: false
  }

  protected reviewsOptions: OwlOptions = {
    loop: true,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    dots: false,
    margin: 26,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 2
      },
      740: {
        items: 3
      },      
    },
    nav: false
  }

  public ngOnInit(): void {
    this.productService.getBestProducts()
      .subscribe((data: ProductType[]) => {
        this.products.set(data);
      })
  }
}
