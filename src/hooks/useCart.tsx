import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updateCart = [...cart];
      const existProduct = updateCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);
      const amountStock = stock.data.amount;
      const amountCurrent = existProduct ? existProduct.amount : 0;
      const amount = amountCurrent + 1;

      if (amount > amountStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (existProduct) {
        existProduct.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);

        const productNew = {
          ...product.data,
          amount: 1
        }
        updateCart.push(productNew);
      }

      setCart(updateCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updateCart = [...cart];
      const productItem = updateCart.findIndex(product => product.id === productId);

      if (productItem >= 0){
        updateCart.splice(productItem, 1);
        setCart(updateCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
      } else {
        throw Error();
      } 
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <=0){
        return;
      }
      
      const stock = await api.get(`/stock/${productId}`);
      const amountStock = stock.data.amount;

      if( amount > amountStock){
        toast.error('Quantidade solicitada fora de estoque');
        
        return;
      }

      const updateCart = [...cart];
      const existProduct = updateCart.find(product => product.id === productId);

      if (existProduct) {
        existProduct.amount = amount;
        setCart(updateCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
