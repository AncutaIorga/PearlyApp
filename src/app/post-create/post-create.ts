import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../services/post';
import { UserService } from '../services/user';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  standalone: true,
  imports: [FormsModule, NavbarComponent],
  templateUrl: './post-create.html',
  styleUrl: './post-create.css'
})
export class PostCreateComponent {
  text = '';
  selectedImage: string | null = null;

  constructor(
    private postService: PostService,
    private userService: UserService,
    private router: Router
  ) {}

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
  }

  submit() {
    if (this.text.trim()) {
      const currentUser = this.userService.getUser();

      this.postService.addPost({
        user: currentUser.name,
        userAvatar: currentUser.avatar,
        image:
          this.selectedImage ||
          'https://picsum.photos/400/30' + Math.floor(Math.random() * 10),
        text: this.text
      });

      this.text = '';
      this.selectedImage = null;
      this.router.navigate(['/feed']);
    }
  }
}
