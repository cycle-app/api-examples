import { fetchChangeLog } from '../../utils';
import { slug } from '../../config';

const main = async () => {
  try {
    const releases = await fetchChangeLog({ slug });
    if (!releases.length) {
      console.error(`No releases found for slug: ${slug}`);
      process.exit();
    }
    console.info(`ℹ️ ${releases.length} release(s) found`);
    releases.forEach((release) => {
      console.info(`- ${release.date} - ${release.title || 'No title'}`);
      console.info(
        `-- contains: ${release.releaseNotes.length} release note(s)`
      );
    });
  } catch (error: any) {
    console.error('Error', error.message);
  }
};

main();
