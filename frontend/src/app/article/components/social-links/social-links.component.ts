import { Component } from '@angular/core';
import { TablerIconComponent } from '../../../shared/components/tabler-icon/tabler-icon.component';

interface SocialLink {
  icon: string;
  label: string;
  url: string;
  color: string;
}

@Component({
  selector: 'app-social-links',
  standalone: true,
  imports: [TablerIconComponent],
  template: `
    <div class="social-links-card">
      <h2>Connect</h2>
      
      <!-- Social Media Links -->
      <div class="social-buttons">
        @for (social of socialLinks; track social.label) {
          <a 
            [href]="social.url" 
            target="_blank" 
            rel="noopener noreferrer"
            class="social-btn"
            [attr.aria-label]="social.label"
            [style.--hover-color]="social.color">
            <tabler-icon [name]="social.icon" [size]="20" />
            <span class="btn-label">{{ social.label }}</span>
          </a>
        }
      </div>
    </div>
  `,
  styles: [
    `
    :host {
      display: block;
    }

    .social-links-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      margin-bottom: 24px;
    }

    .social-links-card h2 {
      margin: 0 0 20px;
      font-size: 1.1rem;
      font-weight: 600;
      padding-bottom: 16px;
      border-bottom: 1px solid #30363d;
      letter-spacing: -0.3px;
      color: #e6edf3;
    }

    .social-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }

    .social-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 8px;
      color: #c9d1d9;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      justify-content: center;
    }

    .social-btn:hover {
      background: var(--hover-color, #30363d);
      border-color: var(--hover-color, #484f58);
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .social-btn tabler-icon {
      flex-shrink: 0;
      display: none;
    }

    .btn-label {
      white-space: nowrap;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .social-btn {
        flex: 1;
        min-width: calc(50% - 4px);
        justify-content: center;
      }
    }
  `,
  ],
})
export class SocialLinksComponent {
  readonly socialLinks: SocialLink[] = [
    {
      icon: 'brandGithub',
      label: 'GitHub',
      url: 'https://github.com',
      color: '#f0f6fc',
    },
    {
      icon: 'brandTwitter',
      label: 'Twitter',
      url: 'https://twitter.com',
      color: '#1d9bf0',
    },
    {
      icon: 'brandLinkedin',
      label: 'LinkedIn',
      url: 'https://linkedin.com',
      color: '#0a66c2',
    },
    {
      icon: 'brandDiscord',
      label: 'Discord',
      url: 'https://discord.com',
      color: '#5865f2',
    },
  ];
}
