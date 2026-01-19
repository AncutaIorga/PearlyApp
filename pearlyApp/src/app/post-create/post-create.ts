import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostService } from '../services/post';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  standalone: true,
  imports: [FormsModule, NavbarComponent],
  templateUrl: './post-create.html'
})
export class PostCreateComponent {
  text = '';

  constructor(private postService: PostService) {}

  submit() {
    this.postService.addPost({
      id: Date.now(),
      user: 'Healthy User',
      image: 'https://picsum.photos/400/302',
      text: this.text,
      likes: 0
    });

    this.text = '';
  }
}
