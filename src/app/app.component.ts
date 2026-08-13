import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Link, LinkService } from './link.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private links = inject(LinkService);

  title = 'snip-frontend';
  url = signal('');
  items = signal<Link[]>([]);
  created = signal<Link | null>(null);
  error = signal<string | null>(null);
  submitting = signal(false);

  ngOnInit(): void {
    this.refresh();
  }

  private isHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  refresh(): void {
    this.links.list().subscribe({
      next: (data) => this.items.set(data),
      error: () => this.error.set('Could not load links.'),
    });
  }

  submit(): void {
    const value = this.url().trim();
    this.error.set(null);
    this.created.set(null);

    if (!this.isHttpUrl(value)) {
      this.error.set('Enter a valid http:// or https:// URL.');
      return;
    }

    this.submitting.set(true);
    this.links.create(value).subscribe({
      next: (link) => {
        this.created.set(link);
        this.url.set('');
        this.submitting.set(false);
        this.refresh();
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.error ?? 'Request failed. Is the backend running?');
      },
    });
  }
}
