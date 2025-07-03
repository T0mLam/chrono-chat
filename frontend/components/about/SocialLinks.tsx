import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { IconType } from 'react-icons';

type SocialLink = {
  name: string;
  url: string;
  icon: IconType;
};

const defaultSocialLinks: SocialLink[] = [
  {
    name: 'GitHub',
    url: 'https://github.com/your-username/chrono-chat',
    icon: FaGithub,
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com/your-handle',
    icon: FaTwitter,
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com/in/your-profile',
    icon: FaLinkedin,
  },
];

interface SocialLinksProps {
  links?: SocialLink[];
}

export function SocialLinks({ links = defaultSocialLinks }: SocialLinksProps) {
  return (
    <div className="w-full py-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-md text-gray-600 dark:text-gray-400">
              Enjoy our work?
            </h3>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Stay connected!
            </h2>
          </div>
          <div className="flex gap-6">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  <Icon className="w-6 h-6" />
                  <span className="sr-only">{link.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 