import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../services/post';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  standalone: true,
  imports: [FormsModule, NavbarComponent],
  templateUrl: './post-create.html',
  styleUrl: './post-create.css'  // ⚠️ Agregar esta línea
})
export class PostCreateComponent {
  text = '';

  constructor(
    private postService: PostService,
    private router: Router
  ) {}

  submit() {
    if (this.text.trim()) {
      this.postService.addPost({
        id: Date.now(),
        user: 'Healthy User',
        image: 'https://picsum.photos/400/30' + Math.floor(Math.random() * 10),
        text: this.text,
        likes: 0
      });

      this.text = '';
      this.router.navigate(['/feed']);
    }
  }
}