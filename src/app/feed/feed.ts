import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../services/post';
import { BlockService } from '../services/block';
import { PostCardComponent } from '../shared/post-card/post-card';
import { NavbarComponent } from '../shared/navbar/navbar';

@Component({
  standalone: true,
  imports: [CommonModule, PostCardComponent, NavbarComponent],
  templateUrl: './feed.html',
  styleUrl: './feed.css'
})
export class FeedComponent {
  private postService = inject(PostService);
  private blockService = inject(BlockService);

  // Renombrado a 'posts' para que coincida con tu HTML
  posts = computed(() => {
    const allPosts = this.postService.getAllPosts();
    const blocks = this.blockService.blockedUsers();
    const mutes = this.blockService.mutedUsers();
    
    return allPosts.filter(post => 
      !blocks.some(b => b.name === post.user) && 
      !mutes.some(m => m.name === post.user)
    );
  });
}