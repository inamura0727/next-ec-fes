import { withIronSessionApiRoute } from 'iron-session/next';
import { ironOptions } from '../../../lib/ironOprion';
import { NextApiRequest, NextApiResponse } from 'next';
import { User, UserCart, RentalHistory } from '../../types/user';

export default withIronSessionApiRoute(getUserRoute, ironOptions);

export type SessionUser = {
  userId?: number;
  userCarts?: UserCart[];
  userRentalHistory?: RentalHistory[];
  isLoggedIn: boolean;
};

async function getUserRoute(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.session.user) {
    const result = await fetch(
      `http://localhost:3000/api/users/${req.session.user.id}`
    );
    const userData: User = await result.json();
    let cart: UserCart[] = userData.userCarts;
    let rentalHistory: RentalHistory[] = userData.rentalHistorys;
    const time = new Date();

    if (!cart) {
      return false;
    }
    cart.map((item) => {
      const addItem: RentalHistory = {
        id: item.id,
        price: item.price,
        itemImage: item.itemImage,
        rentalPeriod: item.rentalPeriod,
        payDate: time,
      };
      // レンタル履歴がundefiedの場合は配列を新規作成
      if (!rentalHistory) {
        rentalHistory = [addItem];
      }
      // レンタル履歴に追加
      rentalHistory.push(addItem);
    });
    // カートを空にする
    cart = [];
    // データベースを更新する
    const data = { userCarts: cart, rentalHistorys: rentalHistory };
    await fetch(
      `http://localhost:3000/api/users/${req.session.user.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    ).then(() => res.redirect('/paymentComp'));
  }
}
