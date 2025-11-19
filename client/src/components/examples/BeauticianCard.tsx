import BeauticianCard from '../BeauticianCard';
import profileImage from '@assets/generated_images/Beautician_profile_one_9fa3b2a4.png';

export default function BeauticianCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <BeauticianCard
        name="Sarah Al-Mansouri"
        image={profileImage}
        specialties={["Makeup", "Lashes"]}
        rating={4.9}
        bookingCount={287}
        startingPrice="د.إ 200"
        location="Dubai Marina"
      />
    </div>
  );
}
