import ServiceCard from '../ServiceCard';
import manicureImage from '@assets/generated_images/Luxury_manicure_service_c3f81114.png';

export default function ServiceCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <ServiceCard
        image={manicureImage}
        title="Premium Manicure"
        description="Elegant nail care with luxury products and expert techniques"
        priceRange="د.إ 150 - 300"
        rating={4.8}
        reviewCount={124}
      />
    </div>
  );
}
