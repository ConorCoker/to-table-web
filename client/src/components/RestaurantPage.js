import React from 'react';
import { useParams } from 'react-router-dom';

const RestaurantPage = () => {
    const { restaurantId } = useParams();
    return <div>Restaurant Page for ID: {restaurantId}</div>;
};

export default RestaurantPage;