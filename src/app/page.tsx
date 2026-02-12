import Input from '../components/ui/Input';
import TemplateCard from '../components/TemplateCard';
import RecentDocuments from '../components/RecentDocuments';
import styles from './home.module.css';

export default function HomePage() {
  return (
    <div className={styles.homeBg}>
      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.leftCol}>
          <h1 className={styles.heading}>
            What would you like to create today?
          </h1>
          {/* Search Bar */}
          <div className={styles.searchBarWrap}>
            <div className={styles.searchBar}>
              <Input placeholder="Search a template" className={styles.input} />
              <span className={styles.searchIcon}>🔍</span>
            </div>
          </div>
          {/* Template Cards Grid */}
          <div className={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <TemplateCard key={i} />
            ))}
          </div>
        </div>
        {/* Recent Documents Sidebar */}
        <aside className={styles.sidebar}>
          <RecentDocuments />
        </aside>
      </main>
    </div>
  );
}
